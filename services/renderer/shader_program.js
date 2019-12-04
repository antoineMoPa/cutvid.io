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

  async get_video_frame_at_time(texture, fps, trimBefore, from, video_time) {
    let digest = texture.videoDigest;
    let base_path = window.lattefx_settings.cloud;
    let has_video = false;
    if(this.has_vid_in_cache == false){
      // Verify if server has file
      let resp = await fetch(base_path + "/has_vid_in_cache/" + digest, {
        cache: 'no-cache'
      });

      this.has_vid_in_cache = (await resp.text() == "true");

      setTimeout(function(){
        // Clear our cache info sometimes
        // Don't delete this line
        this.has_vid_in_cache = false;
      }.bind(this),10000);
    }

    if(!this.has_vid_in_cache){
      // Upload video
      let form = new FormData();
      form.append('video.vid', texture.videoFile);
      this.update_render_status("Uploading a video (0%)");

      await this.fetch_with_progress(base_path + "/upload_video/" + digest, form);
    }

    let frame_num = leading_zeros(1,6);
    this.update_render_status("Server is extracting frames");
    let url = base_path + "/get_video_frame/" +
        digest + "/" + fps + "/"+video_time;

    return await url_to_image(url);
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
    let texture =  gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);

    this.textures[name] = {texture};

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(
      gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, data.data
    );

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

    if(options.videoFile != undefined || options.video_media_getter != undefined){
      isVideo = true;
      isAudio = true;
      videoElement = document.createElement("video");
    }

    if(isVideo || options.audioFile != undefined ||
       options.audio_media_getter != undefined){
      // Video also have an audio element for rendering purposes
      isAudio = true;
      audioElement = document.createElement("audio");

      if(!isVideo){
        isAudioOnly = true;
      }
    }

    if(isVideo){
      videoElement.addEventListener("error", function(error){
        options.onerror();
      });

      // Hack to suppress lag in my old chromebook:
      {
        document.body.appendChild(videoElement);
        videoElement.style.position = "absolute";
        videoElement.style.left = "-1000px";
        videoElement.style.width = "400px";
      }
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

    function updateVideo(){
      /*
        Returns true on success
       */
      if(!videoInitialized){
        load();
        videoInitialized = true;
      } else {
        let texture = app.textures[name].texture;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        if (videoElement.readyState >= 2) { // Fix firefox black screen
          gl.texImage2D(
            gl.TEXTURE_2D, level, internalFormat,
            srcFormat, srcType, videoElement);
        } else {
          return false;
        }
      }
      return true;
    }

    async function updateVideoHQ(fps, trimBefore, from, video_time){
      let texture = app.textures[name];
      gl.bindTexture(gl.TEXTURE_2D, texture.texture);

      app.update_render_status("Fetching a frame from server");
      let image = await app.get_video_frame_at_time(
        texture, fps, trimBefore, from, video_time
      );

      gl.texImage2D(
        gl.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, image);
    }

    async function load() {
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

      let url = source;

      if (source.tagName != undefined && source.tagName == "CANVAS") {
        url = source.toDataURL();
      }

      app.textures[name] = {
        texture,
        isVideo,
        isAudio,
        videoElement: videoElement,
        audioElement: audioElement,
        updateVideo: updateVideo,
        updateVideoHQ: updateVideoHQ,
        url
      };

      if(options.video_media_id != null) {
        app.textures[name].videoDigest = options.video_media_id;
      } else if (options.audio_media_id != null) {
        app.textures[name].audioDigest = options.audio_media_id;
      } else if (isVideo) {
        await app.get_file_digest(options.videoFile).then((digest) => {
          app.textures[name].videoDigest = digest;
          app.textures[name].videoFile = options.videoFile;
        });
      } else if (isAudioOnly) {
        // Create digest for audio-only files
        await app.get_file_digest(options.audioFile).then((digest) => {
          app.textures[name].audioDigest = digest;
          app.textures[name].audioFile = options.audioFile;
        });
      }

      if(!isAudioOnly){
        gl.texImage2D(
          gl.TEXTURE_2D, level, internalFormat,
          srcFormat, srcType, image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }

      ready();
    }

    let timeUpdate = false;
    let canplay = false;

    function checkReady(){
      if(timeUpdate && canplay){
        updateVideo();
        options.ready.bind(videoElement)();

        // Don't call again
        timeUpdate = false;
        canplay = false;
      }
    }

    // Handle videos/canvas texture
    if(isVideo){
      let video_blob_url = await options.video_media_getter();

      videoElement.addEventListener("timeupdate", function(){
        timeUpdate = true;
        checkReady();
      });
      videoElement.addEventListener("canplay", function(){
        canplay = true;
        checkReady();
      });

      videoElement.src = video_blob_url;
      audioElement.src = video_blob_url;
      videoElement.loop = true;
      videoElement.muted = true;

      videoElement.play().catch(function(error){
        console.error("ShaderProgram video error: " + error);
      });
      if(!autoplay){
        videoElement.pause();
      }

    } else if (isAudioOnly) {
      let audio_blob_url = await options.audio_media_getter();

      audioElement.addEventListener("canplay", function(){
        options.ready.bind(audioElement)();
      });

      load();

      audioElement.play().catch(function(error){
        console.error("Shader program audio error:" + error);
      });

      if(!autoplay){
        audioElement.pause();
      }

      audioElement.src = audio_blob_url;

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

    if(this.textures[name].isVideo){
      let el = this.textures[name].videoElement;
      if(el.parentNode != null){
        el.parentNode.removeChild(el);
      }
    }
    if(this.textures[name].isAudio){
      let el = this.textures[name].audioElement;
      if(el.parentNode != null){
        document.body.removeChild(el);
      }
    }

    if(this.textures[name].isVideo){
      // Don't delete texture if audio only
      gl.deleteTexture(this.textures[name].texture);
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
