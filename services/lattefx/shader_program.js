function leading_zeros(num, num_zeros){
  let str_num = num + "";
  while(str_num.length < num_zeros){
    str_num = "0" + str_num;
  }
  return str_num;
}

async function url_to_image(dataurl){
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
    image.src = dataurl;
  });
}

class ShaderProgram {
  constructor(gl){
    this.gl = gl;
    this.fragment_shader_object = null;
    this.vertex_shader_object = null;
    this.fragment_shader_code = null;
    this.textures = {};
  }

  async get_file_digest(file) {
    let buf = await file.arrayBuffer();
    let digest = await crypto.subtle.digest('SHA-1', buf);
    // thanks MDN for the next lines
    let array = Array.from(new Uint8Array(digest))
    let hashHex = array.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  }

  async get_video_frame_at_time(texture, fps, trimBefore, from, video_time) {
    let digest = texture.videoDigest;
    let base_path = window.lattefx_settings.renderer;

    // Verify if server has file
    let resp = await fetch(base_path + "/has_vid_in_cache/" + digest, {
      cache: 'no-cache'
    });

    let has_video = await resp.text();

    if(has_video != "true"){
      // Upload video
      let form = new FormData();
      form.append('video.vid', texture.videoFile);

      await fetch(base_path + "/upload_video/" + digest, {
        method: 'POST',
        mode: 'cors',
        body: form
      });

      console.log("upload done");
    }

    let frame_num = leading_zeros(1,6);
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
      console.log(gl.getProgramInfoLog(program));
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

  // Took from MDN:
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
  // Initialize a texture and load an image.
  // When the image finished loading copy it into the texture.
  //
  set_texture(name, url, ready, options) {
    let app = this;
    ready = ready || (() => {});
    options = options || {};

    let isVideo = false;
    let videoElement = null;
    let audioElement = null;
    let autoplay = options.autoplay;

    if(options.videoFile != undefined){
      isVideo = true;
      videoElement = document.createElement("video");
      audioElement = document.createElement("audio");

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
    var border = 0;
    var srcFormat = gl.RGBA;
    var srcType = gl.UNSIGNED_BYTE;
    var pixel = new Uint8Array([0, 0, 0, 0]);
    var image = null;

    if(!isVideo){
      image = new Image();
    } else {
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

      let image = await app.get_video_frame_at_time(
        texture, fps, trimBefore, from, video_time
      );

      gl.texImage2D(
        gl.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, image);
    }

    async function load() {
      if(!isVideo &&
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

      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      app.textures[name] = {
        texture,
        isVideo,
        videoElement: videoElement,
        audioElement: audioElement,
        updateVideo: updateVideo,
        updateVideoHQ: updateVideoHQ,
      };

      if (isVideo) {
        await app.get_file_digest(options.videoFile).then((digest) => {
          app.textures[name].videoDigest = digest;
          app.textures[name].videoFile = options.videoFile;
        });
      }

      gl.texImage2D(
        gl.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, image);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

      ready();
    }

    let timeUpdate = false;
    let canplay = false;

    function checkReady(){
      if(timeUpdate && canplay){
        options.ready.bind(videoElement)();
        updateVideo();
        // Don't call again
        timeUpdate = false;
        canplay = false;
      }
    }

    // Handle videos/canvas texture
    if(isVideo){
      let videoBlobURL = window.URL.createObjectURL(options.videoFile);

      videoElement.addEventListener("timeupdate", function(){
        timeUpdate = true;
        checkReady();
      });
      videoElement.addEventListener("canplay", function(){
        canplay = true;
        checkReady();
      });
      videoElement.currentTime = 0;
      videoElement.src = videoBlobURL;
      audioElement.src = videoBlobURL;
      videoElement.loop = true;
      videoElement.muted = true;
      videoElement.play().catch(function(error){
        console.log(error);
      });
      if(!autoplay){
        videoElement.pause();
      }
    } else if(url.tagName != undefined && url.tagName == "CANVAS"){
      image = url;
      load();
    } else {
      image.addEventListener("load", load);
      image.src = url;
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
      document.body.removeChild(this.textures[name].videoElement);
    }

    gl.deleteTexture(this.textures[name].texture);
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
