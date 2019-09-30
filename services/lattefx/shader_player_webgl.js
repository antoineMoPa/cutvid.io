/* Note: I actually downgraded to webgl1 to support more devices */
/* Note 2: This should be renamed engine or something */

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
    this.sequences = [];
    this.past_durations = 0;
    this.shaderProgram = null;
    this.last_frame_time = new Date().getTime();

    // TODO: synchronize with vue
    this.width = 540;
    this.height = 540;
    this.rendering = false;
    this.mouse = [0, 0];

    // Create time object just to be by reference
    this.time = {};
    this.time.time = 0.0;
    this.on_progress = function(progress){};

    this.PREVIOUS_PASS_0 = 0;
    this.PREVIOUS_PASS_1 = 1;
    this.PREVIOUS_LAYER_0 = 2;
    this.PREVIOUS_LAYER_1 = 3;
    this.PREVIOUS_LAYER_2 = 4;

    this.on_resize_listeners = {};

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

  dump_audio(){
    let audio_info = [];
    let audio_src = [];

    this.for_each_textures((t,s) => {
      if(t.isVideo && !t.videoElement.muted){
        audio_info.push({
          from: s.from,
          to: s.to,
          trimBefore: s.trimBefore,
          videoFile: s.videoFile
        });
        audio_src.push(t.videoElement.src);
      } else if (t.isAudio){
        alert("TODO");
      }
    });

    return {audio_info, audio_info};
  }

  for_each_textures(callback){
    let layers_info = this.get_sequences_by_layers();
    let sbl = layers_info.sequencesByLayer;

    for(let i in sbl){
      for(let j in sbl[i]){
        let seq = sbl[i][j];
        let texs = seq.pass.textures;
        let keys = Object.keys(texs);
        for(let k in keys){
          callback(texs[keys[k]], seq);
        }
      }
    }
  }

  for_each_current_videos(callback){
    this.for_each_textures((t) => {
      if(t.isVideo){
        callback(t);
      }
    });
  }

  play(){
    this.paused = false;
    this.for_each_current_videos((v) => {v.videoElement.play()});
    this.last_frame_time = new Date().getTime();
  }

  pause(){
    this.paused = true;
    this.for_each_current_videos((v) => {v.videoElement.pause()});
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
    this.call_resize_listeners();
  }

  set_height(h) {
    this.height = h;
    this.update();
    this.init_gl();
    this.call_resize_listeners();
  }

  add_on_resize_listener(listener, uniqueID){
    this.on_resize_listeners[uniqueID] = listener;
  }

  delete_on_resize_listener(listener, uniqueID){
    this.on_resize_listeners[uniqueID] = null;
  }

  call_resize_listeners(){
    let listeners = this.on_resize_listeners;
    Object.keys(listeners).forEach(function(index){
      let element = listeners[index];
      if(element == null){
        return;
      }
      try{
        element();
      } catch (e) {
        console.error("Probably a destroyed component callback on a dead component?" + e);
      }
    });
  }

  set_fps(fps) {
    this.fps = fps;
    this.update();
  }

  /* callback receives a canvas element */
  render(time, callback) {
    let app = this;
    callback = callback || function () {};

    if(this.draw_gl(time)){
      callback(this.canvas);
    } else {
      // Try again
      setTimeout(function(){
        app.render(time, callback);
      }, 30);
    }
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

    this.clear();

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

    for(let sequence = 0; sequence < this.sequences.length; sequence++){
      let to = this.sequences[sequence].to || 0;

      if(to > duration){
        duration = to;
      }
    }

    return duration;
  }

  clear() {
    let gl = this.gl;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  get_sequences_by_layers(){
    let time = this.time.time;

    let maxLayer = 0;

    let sequencesByLayer = [
      [],[],[],[],[],[],
    ];

    for(let i = 0; i < this.sequences.length; i++){
      let seq = this.sequences[i];
      if(time < seq.from || time > seq.to){
        continue;
      }
      for(let j = 0; j < seq.effects.length; j++){
        let effect = seq.effects[seq.effectsIndex[j]];
        let arr = sequencesByLayer[seq.layer||0]; /* TODO: remove ||0 ||0 and ||1 once templates work */
        if(effect == undefined){
          continue;
        }
        for(let k = 0; k < effect.shaderPrograms.length; k++){
          seq.layer = seq.layer || 0;/* TODO: remove ||0 ||0 and ||1 once templates work */
          sequencesByLayer[seq.layer] =
            sequencesByLayer[seq.layer].concat({
              from: seq.from || 0, /* TODO: remove ||0 ||0 and ||1 once templates work */
              to: seq.to || 1,
              pass: effect.shaderPrograms[k],
              uniforms: effect.uniforms,
              trimBefore: effect.trimBefore || 0
            });
          if(seq.layer > maxLayer){
            maxLayer = seq.layer;
          }
        }
      }
    }

    return {maxLayer, sequencesByLayer}
  }

  draw_gl(force_time) {
    const gl = this.gl;
    let texSuccess = true;

    if (gl == null) {
      return;
    }

    let duration = this.get_total_duration();


    if(force_time != undefined){
      this.time.time = force_time;
    } else if (!this.paused) {
      let raw_time = new Date().getTime();
      let delta = raw_time - this.last_frame_time;
      this.time.time += delta / 1000.0;
      this.time.time = this.time.time % duration;
      this.last_frame_time = raw_time;
    }



    let time = this.time.time;

    this.on_progress(time, duration);

    if(this.sequences.length == 0){
      return;
    }

    let layers_info = this.get_sequences_by_layers();
    let maxLayer = layers_info.maxLayer;
    let sequencesByLayer = layers_info.sequencesByLayer;

    this.clear();
    let is_first = 1.0;

    let passCounter = 0;
    let layerCounter = 0;
    for (let layer = 0; layer < sequencesByLayer.length; layer++) {
      let sequences = sequencesByLayer[layer];
      for (let sequenceIndex = 0; sequenceIndex < sequences.length; sequenceIndex++) {
        let incrementedPasses = false;
        let seq = sequences[sequenceIndex];
        let currentRelativeTime = (time - seq.from) / parseFloat(seq.to - seq.from);

        let shaderProgram = seq.pass;
        shaderProgram.use();
        let program = shaderProgram.program;

        if (layer < maxLayer) {
          if(sequenceIndex == sequences.length - 1){
            // We are rendering last pass of layer
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer[this.PREVIOUS_LAYER_0 +(layerCounter % 3)]);
            layerCounter++;
          } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer[this.PREVIOUS_PASS_0 + (passCounter % 2)]);
            passCounter++;
            incrementedPasses = true;
          }
        } else if (sequenceIndex < sequences.length - 1) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer[this.PREVIOUS_PASS_0 + (passCounter % 2)]);
          passCounter++;
          incrementedPasses = true;
        } else {
          // null = screen
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        let i = 0;

        gl.activeTexture(gl.TEXTURE0 + i);

        // The previous_pass buffer cycles constantly
        let lastID = this.PREVIOUS_PASS_0 + ((passCounter + (incrementedPasses?0:1)) % 2);
        gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[lastID]);
        gl.uniform1i(gl.getUniformLocation(program, 'previous_pass'), i);

        i++

        gl.activeTexture(gl.TEXTURE0 + i);

        // Also add previous pass
        if (layer > 0) {
          let lastLayerID = this.PREVIOUS_LAYER_0 + ((layerCounter + 2) % 3);
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[lastLayerID]);
          gl.uniform1i(gl.getUniformLocation(program, 'previous_layer'), i);
        }

        i++;

        if (layer > 1) {
          let lastLayerID = this.PREVIOUS_LAYER_0 + ((layerCounter + 1) % 3);
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[lastLayerID]);
          gl.uniform1i(gl.getUniformLocation(program, 'previous_previous_layer'), i);
        }

        i++;

        for(let name in shaderProgram.textures){
          let tex = shaderProgram.textures[name];
          gl.activeTexture(gl.TEXTURE0 + i);
          var att = gl.getUniformLocation(program, name);

          if(tex.isVideo){
            // Seek to right time
            let trimBefore = parseFloat(seq.trimBefore);
            let timeFrom = parseFloat(seq.from);
            let shouldBeTime = time - timeFrom + trimBefore;
            let currTime = tex.videoElement.currentTime;

            if (this.rendering && tex.videoElement.currentTime != shouldBeTime){
              tex.videoElement.currentTime = shouldBeTime;
            } else if (this.paused && Math.abs(shouldBeTime - currTime) > 0.2) {
              tex.videoElement.currentTime = shouldBeTime;
              tex.videoElement.play();
              tex.videoElement.pause();
            } else if (Math.abs(shouldBeTime - currTime) > 2.0) {
              tex.videoElement.pause();
              tex.videoElement.currentTime = shouldBeTime;
              tex.videoElement.play();
            }

            texSuccess &= tex.updateVideo();
          } else {
            gl.bindTexture(gl.TEXTURE_2D, tex.texture);
          }
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

        const isFirstAttribute = gl.getUniformLocation(program, 'is_first');
        gl.uniform1f(isFirstAttribute, is_first);
        is_first = 0.0;

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

        for(let name in seq.uniforms){
          let uni = seq.uniforms[name];
          let attribute = gl.getUniformLocation(program, name);

          if(uni.type == "f"){
            gl.uniform1f(attribute, parseFloat(uni.value));
          }
        }

        gl.viewport(0, 0, this.width, this.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Send preview sometimes
        if( !this.rendering &&        /* Don't interfere with render*/
            currentRelativeTime < 0.6 &&  /* Aim the middle of scene */
            currentRelativeTime > 0.4 &&
            Math.random() < 0.3           /* Not all the time*/
          ){
        }
      }
    }

    if(this.rendering && !texSuccess){
      return false;
    }
    return true;
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
      // When rendering gif, draw is done elsewhere
      if (!player.rendering && player.window_focused) {
        try{
          player.draw_gl();
        } catch (e) {
          console.error(e);
        }
      }

      window.requestAnimationFrame(_animate.bind(this));
    }

    window.requestAnimationFrame(_animate.bind(this));
  }
}
