function leading_zeros(num, num_zeros){
  let str_num = num + "";
  while(str_num.length < num_zeros){
    str_num = "0" + str_num;
  }
  return str_num;
}

async function url_to_image(url){
  // Thanks to https://stackoverflow.com/questions/46399223
  // on this one:
  return new Promise((resolve, reject) => {
    let image = new Image();
    image.crossOrigin = "use-credentials";
    image.onload = function () { resolve(image); };
    image.onerror = function(e){
      console.error(e);
      reject();
    };
    image.src = url;
  });
}

async function file_to_arraybuffer(file){
  return new Promise((resolve, reject) => {
	let reader = new FileReader();
    reader.onloadend = function(e){
	  resolve(reader.result);
      reject();
    };
	reader.readAsArrayBuffer(file);
  });
}

class ShaderProgram {
  constructor(gl, headless){
    this.gl = gl;
    this.fragment_shader_object = null;
    this.vertex_shader_object = null;
    this.fragment_shader_code = null;
    this.headless = headless || false;
    this.textures = {};
    this.has_vid_in_cache = false;
    this.frames_cache = null;
    this.file_store = window.API.call("shader_player.get_file_store");
  }

  async extract_frames(file_name, fps, trimBefore, from, video_time, max_time_to_extract){
    if(this.frames_cache != null){
      return this.frames_cache;
    }

    this.file_store = window.API.call("shader_player.get_file_store");

    window.API.call("ui.begin_progress");
    let frame_regex = /frame=\s*([0-9]*)/;

    let total_frames = fps * max_time_to_extract;
    let cancelled = false;

    let result = await utils.run_ffmpeg_task({
      arguments: [
        "-accurate_seek",
        "-ss", video_time+"",
        "-y",
        "-i", "video.video",
        "-frames:v", parseInt(Math.ceil(max_time_to_extract * fps))+"",
        //"-start_number", "0",
        "-r", fps + "",
        "image-%06d.png"
      ],
      MEMFS: [{
        name: "video.video", data: await this.file_store.files[file_name].arrayBuffer()
      }],
      logger: function(m){
        if(m == "Conversion failed!"){
          window.API.call(
            "utils.flag_error",
            "We encountered an error while converting your file."
          );
          window.API.call("ui.clear_progress");
        }
        if(frame_regex.test(m)){
          let match = frame_regex.exec(m);
          let frame = match[1];
          let progress = frame / total_frames;
          window.API.call(
            "ui.set_progress",
            progress, `Extracting video : frame ${frame} of ${parseInt(total_frames)}.`,
            function cancel_action(){
              utils.cancel_workers_by_type("preview");
              window.player.player.cancel_hq_render = true;
              cancelled = true;
              window.API.call(
                "utils.flag_error",
                "Video preview cancelled."
              );
            }
          );
        }
        if(/Invalid data found when processing input/.test(m)){
          window.API.call(
            "utils.flag_error",
            "This video file type is not supported."
          );
          window.API.call("ui.clear_progress");
          resolve(null);
        }
      },
    }, "render");

    if(!cancelled){
      this.frames_cache = result.MEMFS;
    }

    return result.MEMFS;
  }

  fetch_with_progress(url, body){
    let app = this;
    return new Promise(function(resolve, reject) {
      var request = new XMLHttpRequest();

      request.open("POST", url);

      request.addEventListener("progress", progress);
      request.addEventListener("load", transfer_complete);
      request.addEventListener("error", transfer_failed);
      request.addEventListener("abort", transfer_canceled);

      request.send(body);

      // progress on transfers from the server to the client (downloads)
      function progress (event) {
        if (event.lengthComputable) {
          var percent_complete = event.loaded / event.total * 100;
          app.update_render_status("Uploading a video (" + percent_complete + "%)");
        }
      }

      function transfer_complete(event) {
        resolve(request.responseText);
      }

      function transfer_failed(event) {
        reject();
      }

      function transfer_canceled(event) {
        reject();
      }
    });
  }

  update_render_status(new_status){
    let nodes = document.querySelectorAll(".render-status");
    nodes.forEach(function(el){
      el.innerText = new_status
    });
  }

  async get_file_digest(file) {
	let buf = await file_to_arraybuffer(file);
    let digest = await crypto.subtle.digest('SHA-1', buf);
    // thanks MDN for the next lines
    let array = Array.from(new Uint8Array(digest))
    let hashHex = array.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  }

  compile(vertex_shader_code, fragment_shader_code) {
    // For external use
    this.fragment_shader_code= fragment_shader_code;
    this.vertex_shader_code = vertex_shader_code;
    let compiled = false;
    let program = null;
    const player = this;

    if (this.gl == null) {
      return;
    }

    const gl = this.gl;

    this.deleteProgram();

    program = gl.createProgram();

    const vertex_shader = add_shader(gl.VERTEX_SHADER, vertex_shader_code);

    const fragment_shader = add_shader(gl.FRAGMENT_SHADER, fragment_shader_code);

    this.fragment_shader_object = fragment_shader;
    this.vertex_shader_object = vertex_shader;

    function add_shader(type, content) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, content);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const err = gl.getShaderInfoLog(shader);
        console.error(err);
      }

      gl.attachShader(program, shader);

      return shader;
    }

    if (vertex_shader == -1 || fragment_shader == -1) {
      console.error("Shader compilation error.");
      return;
    }

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
    }

    gl.useProgram(program);

    const positionAttribute = gl.getAttribLocation(program, 'position');

    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);

    compiled = true;

    this.program = program;
  }

  use() {
    this.gl.useProgram(this.program);
  }

  set_texture_raw(name, data) {
    let gl = this.gl;
    let level = 0;
    let internalFormat = gl.RGBA;
    let width = 1;
    let height = 1;
    let srcFormat = gl.RGBA;
    let srcType = gl.UNSIGNED_BYTE;

    if(this.textures[name] != undefined) {
      gl.texImage2D(
        gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, data
      );
    } else {
      let texture =  gl.createTexture();

      gl.bindTexture(gl.TEXTURE_2D, texture);

      this.textures[name] = {texture};

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      if (data != null) {
        gl.texImage2D(
          gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, data
        );
      }
    }
  }

  /*
   Initialize a texture and load an image.
   When the image finished loading copy it into the texture.

   In LatteFX's player, to simplify playback, audio elements are textures.

   @param source can be a dataurl or a canvas (but no videos and audio)
   @param options will contain videoElement, audioElement and other settings

   For history, this was originaly took from MDN:
   https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
  */
  async set_texture(name, source, ready, options) {
    let app = this;
    ready = ready || (() => {});
    options = options || {};

    let isVideo = false;
    let isAudio = false;
    let isAudioOnly = false;
    let videoElement = null;
    let audioElement = null;
    let autoplay = options.autoplay;

    if(name == "video"){
      isVideo = true;
      isAudio = true;
      videoElement = await this.file_store.get_video(source);
    }

    if(name == "audio"){
      isAudio = true;
      isAudioOnly = true;
      audioElement = await this.file_store.get_audio(source);
    }

    if(isVideo){
      videoElement.addEventListener("error", function(error){
        options.onerror(error);
      });
    }

    function isPowerOf2(value) {
      return (value & (value - 1)) == 0;
    }

    var gl = this.gl;

    if(gl == null){
      // We are fucked
      return;
    }

    var level = 0;
    var internalFormat = gl.RGBA;
    var width = 1;
    var height = 1;
    var srcFormat = gl.RGBA;
    var srcType = gl.UNSIGNED_BYTE;
    var pixel = new Uint8Array([0, 0, 0, 0]);
    var image = null;

    if(!isVideo && !isAudioOnly) {
      image = new Image();
    } else if (isVideo) {
      image = videoElement;
    }

    let videoInitialized = false;
    let update_video_mutex = false;

    async function updateVideo(){
      /*
        Returns true on success
       */
      if(!videoInitialized){
        if(update_video_mutex){
          return;
        }
        update_video_mutex = true;
        await load();
        videoInitialized = true;
        update_video_mutex = false;
      } else {
        if(app.textures[name] == undefined){
          console.error("Texture should not be undefined if video is initialized");
          return;
        }

        let texture = app.textures[name].texture;

        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        if (videoElement.readyState >= 2) { // Fix firefox black screen
          gl.texImage2D(
            gl.TEXTURE_2D, level, internalFormat, videoElement.width, videoElement.height, 0,
            srcFormat, srcType, videoElement
          );
        } else {
          return false;
        }
      }
      return true;
    }

    async function update_video_hq(fps, trimBefore, from, video_time, max_time_to_extract){
      let frames = await app.extract_frames(this.url, fps, trimBefore,
                                            from, video_time, max_time_to_extract);

      let texture = app.textures[name];
      let frame_num = parseInt(video_time * fps);
      let frame_file_name = `image-${(frame_num+"").padStart(6,0)}.png`
      let frame_data = null;

      for(let i = 0; i < frames.length; i++){
        if(frames[i].name == frame_file_name){
          frame_data = frames[i].data;
          break;
        }
      }

      if(frame_data == null){
        console.error("Video frame ${frame_num} (${frame_file_name}) file not found.");
        return;
      }

      let blob = new Blob([frame_data], {
        type: "image/png"
      });

      let image = await new Promise(function(resolve){
        let image_url = URL.createObjectURL(blob);
        let image = new Image;

        image.onload = function(){ resolve(image); };
        image.src = image_url;
      });

      gl.bindTexture(gl.TEXTURE_2D, texture.texture);
      gl.texImage2D(
        gl.TEXTURE_2D, level, internalFormat, image.width, image.height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, image
      );
    }

    async function load() {
      return new Promise(async function(resolve, reject){
        let url = source;

        if (source.tagName != undefined && source.tagName == "CANVAS") {
          url = source.toDataURL();
        }

        if(!isVideo &&
           !isAudio &&
           options.force_width != undefined ||
           options.force_height != undefined
          ){
          let can = document.createElement("canvas");
          let ctx = can.getContext("2d");
          can.width = options.force_width;
          can.height = options.force_height;
          ctx.drawImage(image, 0, 0, options.force_width, options.force_height);
          image = can;

          // Backend renderer only supports png
          // luckily, Canvas.toDataURL exports as png
          url = can.toDataURL();
        }

        // Cleanup before setting again
        if(app.textures[name] != undefined){
          app.delete_texture(name);
        }

        var texture = null;

        if(!isAudioOnly) {
          texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, texture);
        }

        app.textures[name] = {
          texture,
          isVideo,
          isAudio,
          videoElement: videoElement,
          audioElement: audioElement,
          updateVideo: updateVideo,
          update_video_hq: update_video_hq,
          url
        };

        if(!isAudioOnly && !isVideo){
          gl.texImage2D(
            gl.TEXTURE_2D, level, internalFormat,
            srcFormat, srcType, image);

          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        if(!isVideo && !isAudio){
          // Ready is called elsewhere pour audio
          // and video textures
          ready();
        }
        resolve();
      });
    }

    let timeUpdate = false;
    let canplay = false;

    function checkReady(){
      if(timeUpdate && canplay){
        updateVideo();
        ready(videoElement);

        // Don't call again
        timeUpdate = false;
        canplay = false;
      }
    }

    // Handle videos/canvas texture
    if(isVideo){
      if(videoElement.readyState == 0){
        videoElement.addEventListener("timeupdate", function(){
          timeUpdate = true;
          checkReady();
        });
        videoElement.addEventListener("canplay", function(){
          canplay = true;
          checkReady();
        });
      } else {
        updateVideo();
        ready(videoElement);
      }

      videoElement.loop = true;

      videoElement.play().catch(function(error){
        console.error("ShaderProgram video error: " + error);
      });
      if(!autoplay){
        //videoElement.pause();
      }

    } else if (isAudioOnly) {
      if(audioElement.readyState == 0){
        audioElement.addEventListener("canplay", function(){
          ready(audioElement);
        });
      } else {
        ready(audioElement);
      }

      load();

      audioElement.play().catch(function(error){
        console.error("Shader program audio error:" + error);
      });

      if(!autoplay){
        audioElement.pause();
      }

      load();
    } else if (source.tagName != undefined && source.tagName == "CANVAS"){
      image = source;
      load();
    } else {
      image.addEventListener("load", load);
      image.src = source;
    }
  }

  delete_texture(name) {
    const gl = this.gl;

    if(this.textures[name] == undefined ||
       this.textures[name].texture == undefined){
      console.error("attempt to delete texture which does not exist");
      return;
    }

    if(this.textures[name].isAudio){
      if(this.textures[name].audioElement != null){
        let el = this.textures[name].audioElement;
        if(el.parentNode != null){
          document.body.removeChild(el);
        }
      }
    }

    if(this.textures[name].isVideo){
      // Don't delete texture if audio only
      gl.deleteTexture(this.textures[name].texture);

      if(this.textures[name].videoElement != null){
        let video_element = this.textures[name].videoElement;
        if(video_element.parentNode != null){
          video_element.parentNode.removeChild(video_element);
        }
      }
    }

    delete this.textures[name];
  }

  deleteProgram() {
    const gl = this.gl;
    // Delete previous program
    if (this.program != undefined) {
      gl.useProgram(this.program);
      if (this.fragment_shader_object > -1) {
        gl.detachShader(this.program, this.fragment_shader_object);
        gl.deleteShader(this.fragment_shader);
      }
      if (this.vertex_shader_object > -1) {
        gl.detachShader(this.program, this.vertex_shader_object);
        gl.deleteShader(this.vertex_shader);
      }
      gl.deleteProgram(this.program);
    }
  }
}

if(typeof(module) != "undefined"){
  module.exports = ShaderProgram;
}
