/* Note: I actually downgraded to webgl1 to support more devices */

class ShaderProgram {
  constructor(gl){
    this.gl = gl;
    this.fragment_shader_object = null;
    this.vertex_shader_object = null;
    this.fragment_shader_code = null;
    this.textures = {};
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
  set_texture(name, url, ready) {
    let app = this;
    ready = ready || (() => {});

    // Cleanup before setting again
    if(this.textures[name] != undefined){
      this.delete_texture(name);
    }

    function isPowerOf2(value) {
      return (value & (value - 1)) == 0;
    }

    var gl = this.gl;

    var level = 0;
    var internalFormat = gl.RGBA;
    var width = 1;
    var height = 1;
    var border = 0;
    var srcFormat = gl.RGBA;
    var srcType = gl.UNSIGNED_BYTE;
    var pixel = new Uint8Array([0, 0, 0, 0]);


    var image = new Image();

    image.addEventListener("load", function () {
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      app.textures[name] = texture;

      gl.texImage2D(
        gl.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, image);

      // WebGL1 has different requirements for power of 2 images
      // vs non power of 2 images so check if the image is a
      // power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        // No, it's not a power of 2. Turn of mips and set
        // wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      ready();
    });

    image.src = url;
  }

  delete_texture(name) {
    const gl = this.gl;

    if(this.textures[name] == undefined){
      console.error("attempt to delete texture which does not exist");
      return;
    }

    gl.deleteTexture(this.textures[name]);
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

class ShaderPlayerWebGL2 {
  constructor(canvas) {
    this.fps = 10;
    this.canvas = canvas || document.createElement('canvas');
    this.gl = null;
    this.rttTexture = [];
    this.framebuffer = [];
    this.renderbuffer = [];
    this.renderBufferDim = [];
    this.textures = [];
    this.native_webgl2_supported = false;
    this.window_focused = true;
    this.anim_timeout = null;
    this.paused = false;
    this.scenes = [];
    this.past_durations = 0;
    this.shaderProgram = null;
    this.begin_time = 0;
    this.animate_force_scene = null;

    // TODO: name all other (previous pass, previous_previous_pass)
    this.PREVIOUS_SCENE_BUFFER = 6;
    this.PREVIOUS_SCENE_RTT_TEXTURE = 6;

    // TODO: synchronize with vue
    this.width = 540;
    this.height = 540;
    this.rendering_gif = false;
    this.mouse = [0, 0];

    this.time = 0.0;
    this.on_progress = function(progress){};
    this.on_preview = function(current_scene, canvas){};

    this.on_error_listener = function () {
      console.log('Shader compilation error');
    };

    if(this.gl == null){
      // Init canvas
      var gl = this.canvas.getContext('webgl', {preserveDrawingBuffer: true, premultipliedAlpha: false});

      // Detect webgl2 native problems
      // (read: my old laptop's graphics card is too old)
      // We default to not working
      if (gl != null) {
        this.native_webgl2_supported = true;
      }

      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.gl = gl;
      this.init_gl();
    }

    {
      // To save CPU / GPU
      window.addEventListener('focus', function () {
        this.window_focused = true;
      });

      window.addEventListener('blur', function () {
        this.window_focused = false;
      });
    }
  }

  play(){
    this.paused = false;
  }

  pause(){
    this.paused = true;
  }

  /*
     Generic player functions
     (That would be in an interface if Javascript had that)
   */

  set_container(div) {
    div.appendChild(this.canvas);
  }

  set_width(w) {
    this.width = w;
    this.update();
    this.init_gl();
  }

  set_height(h) {
    this.height = h;
    this.update();
    this.init_gl();
  }

  set_fps(fps) {
    this.fps = fps;
    this.update();
  }

  /* callback receives a canvas element */
  render(time, callback) {
    callback = callback || function () {};
    this.draw_gl(time);
    callback(this.canvas);
  }

  set_on_error_listener(callback) {
    // Call this on error
    this.on_error_listener = callback;
  }

  dispose() {
    if (this.anim_timeout != null) {
      window.clearTimeout(this.anim_timeout);
    }
  }

  update() {
    // Needed when changing passes number
    // (renderbuffer & stuff)
    if (this.gl == null) {
      // Only init once
      this.init_gl();
    }

    this.animate();
  }

  init_gl() {
    if (this.gl == null) {
      return;
    }

    const gl = this.gl;
    let ww = 2;
    let hh = 2;

    // Delete previous textures
    for (var i = 0; i < this.rttTexture.length; i++) {
      gl.deleteTexture(this.rttTexture[i]);
    }
    for (var i = 0; i < this.renderbuffer.length; i++) {
      gl.deleteRenderbuffer(this.renderbuffer[i]);
    }
    for (var i = 0; i < this.framebuffer.length; i++) {
      gl.deleteFramebuffer(this.framebuffer[i]);
    }

    // Find nearest power of 2 above width and height
    while (this.width > ww) {
      ww <<= 1;
    }
    while (this.height > hh) {
      hh <<= 1;
    }

    this.renderBufferDim = [ww, hh];

    // The 10 here limits the pass number
    for (var i = 0; i < 10; i++) {
      this.rttTexture[i] = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[i]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ww, hh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      // Render to texture stuff
      this.framebuffer[i] = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer[i]);

      var renderbuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.rttTexture[i], 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, ww, hh);
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Triangle strip for whole screen square
    const vertices = [
      -1, -1, 0,
      -1, 1, 0,
      1, -1, 0,
      1, 1, 0
    ];

    const tri = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tri);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  }

  get_total_duration() {
    let duration = 0;

    for(let scene = 0; scene < this.scenes.length; scene++){
      duration += parseFloat(this.scenes[scene].scene.duration);
    }

    return duration;
  }

  /* Renders previous scene to previous scene buffer */
  renderPreviousScene(time, currentScene){
    if(currentScene == 0){
      return;
    }

    this.draw_gl(time, currentScene - 1, this.PREVIOUS_SCENE_BUFFER);
  }

  draw_gl(time, force_scene, force_buffer) {
    force_scene = force_scene != undefined? force_scene : null;
    force_buffer = force_buffer != undefined? force_buffer : null;

    const gl = this.gl;

    if (gl == null) {
      return;
    }

    let duration = 0;

    for (let scene = 0; scene < this.scenes.length; scene++) {
      duration += parseFloat(this.scenes[scene].scene.duration);
    }

    if(!this.animate_force_scene){
      // Wrapped in the if because we do the modulo later
      // when forcing a scene
      time = time % duration;
    }

    let current_scene = 0;

    // Pseudotime is used to parse scenes
    // and find current one
    let scene_end_time = 0;

    this.on_progress(time, duration/1000);

    let scene_begin_time = 0
    for (let scene = 0; scene < this.scenes.length; scene++) {
      // Last scene end time becomes current end time
      scene_begin_time = scene_end_time;
      scene_end_time += parseFloat(this.scenes[scene].scene.duration);
      current_scene = scene;

      if( time < scene_end_time ||
          scene == force_scene ||
          scene == this.animate_force_scene) {
        // Found current scene
        break;
      }
    }

    if(force_scene != null) {
      current_scene = force_scene;
    } else if (this.animate_force_scene != null) {
      current_scene = this.animate_force_scene;
    }

    let scene = this.scenes[current_scene];

    if (scene == undefined) {
      return;
    }

    // force_scene overrides animate_force_scene
    if (this.animate_force_scene != null && force_scene == null) {
      time = (time % scene.scene.duration) + scene_begin_time;
    }

    let currentRelativeTime = (time - scene_begin_time) / parseFloat(scene.scene.duration);

    let passes = scene.passes;

    for (let pass = 0; pass < passes.length; pass++) {
      let passData = passes[pass];

      if(passData.beforeRender != undefined && passData.beforeRender != null && force_buffer == null){
        passData.beforeRender(this, time, current_scene);
      }

      let shaderProgram = passData.shaderProgram;
      shaderProgram.use();
      let program = passes[pass].shaderProgram.program;

      if (pass < passes.length - 1) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer[pass]);
      } else if (force_buffer != null){
        // Bind to forced buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer[force_buffer]);
      } else {
        // null = screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }

      let i = 0;

      gl.activeTexture(gl.TEXTURE0 + i);

      // Manage lastpass
      if (pass > 0) {
        gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[pass-1]);
        gl.uniform1i(gl.getUniformLocation(program, 'previous_pass'), i);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, null); // Prevent feedback
      }

      i++

      gl.activeTexture(gl.TEXTURE0 + i);

      // Bind last scene
      if(force_buffer != this.PREVIOUS_SCENE_BUFFER){
        gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[this.PREVIOUS_SCENE_RTT_TEXTURE]);
        gl.uniform1i(gl.getUniformLocation(program, 'previous_scene'), i);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, null);
      }

      i++;

      // Also add previous pass
      if (pass > 1) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[pass-2]);
        gl.uniform1i(gl.getUniformLocation(program, 'previous_previous_pass'), i);
      }

      i++;

      for(let name in shaderProgram.textures){
        gl.activeTexture(gl.TEXTURE0 + i);
        var att = gl.getUniformLocation(program, name);
        gl.bindTexture(gl.TEXTURE_2D, shaderProgram.textures[name]);
        gl.uniform1i(att, i);
        i++;
      }

      gl.uniform2fv(
        gl.getUniformLocation(program, 'renderBufferRatio'),
        [
          this.renderBufferDim[0] / this.width,
          this.renderBufferDim[1] / this.height
        ]
      );

      gl.uniform2fv(
        gl.getUniformLocation(program, 'mouse'),
        [this.mouse[0], this.mouse[1]]
      );

      const passAttribute = gl.getUniformLocation(program, 'pass');
      gl.uniform1f(passAttribute, pass + 1);

      const timeAttribute = gl.getUniformLocation(program, 'time');
      gl.uniform1f(timeAttribute, time);

      const relativeTimeAttribute = gl.getUniformLocation(program, 'relativeTime');
      gl.uniform1f(relativeTimeAttribute, currentRelativeTime);

      const iGlobalTimeAttribute = gl.getUniformLocation(program, 'iGlobalTime');
      const date = new Date();
      let gtime = (date.getTime()) / 1000.0 % (3600 * 24);
      // Add seconds
      gtime += time;
      gl.uniform1f(iGlobalTimeAttribute, gtime);


      const iResolutionAttribute = gl.getUniformLocation(program, 'iResolution');

      gl.uniform3fv(
        iResolutionAttribute,
        new Float32Array(
          [
            this.width,
            this.height,
            1.0
          ]
        ));

      // Screen ratio
      const ratio = this.width / this.height;

      const ratioAttribute = gl.getUniformLocation(program, 'ratio');
      gl.uniform1f(ratioAttribute, ratio);

      for(let name in passData.uniforms){
        let uni = passData.uniforms[name];
        let attribute = gl.getUniformLocation(program, name);

        if(uni.type == "f"){
          gl.uniform1f(attribute, parseFloat(uni.value));
        }
      }

      gl.viewport(0, 0, this.width, this.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Send preview sometimes
      if( !this.rendering_gif &&        /* Don't interfere with render*/
          force_scene == null &&        /* Don't send if rendering past scene */
          currentRelativeTime < 0.6 &&  /* Aim the middle of scene */
          currentRelativeTime > 0.4 &&
          Math.random() < 0.3           /* Not all the time*/
        ){
        this.on_preview(current_scene, this.canvas);
      }
    }
  }

  setZeroTime() {
    this.begin_time = new Date().getTime();
  }

  animate() {
    const player = this;
    let frame = 0;

    // Update width/height
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    if (this.anim_already_started) {
      return;
    }

    this.anim_already_started = true;

    function _animate() {
      let time = new Date().getTime();
      time -= this.begin_time;

      // When rendering gif, draw is done elsewhere
      if (!player.rendering_gif && player.window_focused && !player.paused) {
        try{
          player.draw_gl(time/1000);
        } catch (e) {
          console.error(e);
        }
      }

      window.requestAnimationFrame(_animate.bind(this));
    }

    window.requestAnimationFrame(_animate.bind(this));
  }
}
