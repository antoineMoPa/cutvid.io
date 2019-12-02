/*
  For the history, this file has mostly underscore case
  because it was copied from shadergif's shader player
 */
/* Note: I actually downgraded to webgl1 to support more devices */
/* Note 2: This should be renamed engine or something */

class ShaderPlayerWebGL {
  constructor(canvas, gl) {
    this.fps = 30;

    this.headless = false;

    if(typeof(gl) != "undefined"){
      this.headless = true;
    } else {
      this.canvas = canvas || document.createElement('canvas');
    }

    this.gl = gl || null;
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

    this.PREVIOUS_LAYER_0 = 0;
    this.PREVIOUS_LAYER_1 = 1;
    this.PREVIOUS_LAYER_2 = 2;

    this.on_resize_listeners = {};

    this.on_error_listener = function () {
      console.log('Shader compilation error');
    };

    if(this.gl == null){
      // Init canvas
      var gl = this.canvas.getContext('webgl2', {preserveDrawingBuffer: true, premultipliedAlpha: false});

      // Detect webgl2 native problems
      // (read: my old laptop's graphics card is too old)
      if (gl == null) {
        this.native_webgl2_supported = true;
        gl = this.canvas.getContext('webgl', {preserveDrawingBuffer: true, premultipliedAlpha: false});

        if (gl == null) {
          fetch("/stats/no-webgl/");
        } else {
          fetch("/stats/no-webgl2/");
        }
      }

      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.gl = gl;
      this.init_gl();
    } else if (this.headless){
      this.init_gl();
    }

    if(!this.headless){
      // To save CPU / GPU
      window.addEventListener('focus', function () {
        this.window_focused = true;
      });

      window.addEventListener('blur', function () {
        this.window_focused = false;
      });
    }
  }

  /*
    Gets all audio streams for recording

    Including videos, which can contain audio
   */
  get_all_audio_streams(){
    let streams = [];

    this.for_each_textures((t,s) => {
      if(t.isAudio){
        if(typeof(t.audioElement.captureStream) == "undefined"){
          let track = t.audioElement.mozCaptureStream().getTracks()[0];
          // Firefox is slow on implementing that one
          if(typeof(track) != "undefined"){
            streams.push(track);
          }
        } else {
          let track = t.audioElement.captureStream().getTracks()[0];
          if(typeof(track) != "undefined"){
            streams.push(track);
          }
        }
      }
    }, false);

    return streams;
  }

  for_each_textures(callback, only_current){
    if(typeof(only_current) == "undefined"){
      only_current = true;
    }
    let layers_info = this.get_sequences_by_layers(only_current);
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

  for_each_current_media(callback){
    this.for_each_textures((t) => {
      if(t.isVideo || t.isAudio){
        callback(t);
      }
    });
  }

  play(){
    this.paused = false;
    this.for_each_current_media((m) => {
      // Play video if it is a video
      if(m.isVideo){
        m.videoElement.muted = true;
        m.audioElement.muted = false;
        m.videoElement.play().then(function(){
        }).catch(function(error){
          console.log(error);
        });
      }
      // Play audio
      try{
        m.audioElement.play();
      } catch (e) {
        console.log(e);
        // Probably no audio here
      }
    });
    this.last_frame_time = new Date().getTime();
  }

  pause(){
    this.paused = true;
    this.for_each_textures((t,s) => {
      if (t.isVideo){
        t.audioElement.pause();
        t.videoElement.pause();
      } else if (t.isAudio) {
        t.audioElement.pause();
      }
    }, false);
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

  render(callback) {
    let app = this;
    app.rendering = true;

    this.pause();

    switch(this.renderMode){
    case "LQ":
      this.render_lq(callback);
      break;
    case "HQ":
      this.render_hq(callback);
      break;
    default:
      console.error("Unhandled render mode");
    }
  }

  render_lq(callback) {
    let app = this;
    let video_stream = app.canvas.captureStream(app.fps);
    let all_streams = app.get_all_audio_streams();

    // https://stackoverflow.com/questions/42138545
    let audio_context = new AudioContext();
    let sources = all_streams.map((s) => {
      return audio_context.createMediaStreamSource(new MediaStream([s]))
    });

    let audio_dest = audio_context.createMediaStreamDestination();
    sources.forEach((s) => {
      s.connect(audio_dest)
    });

    let stream = new MediaStream([
      video_stream.getTracks()[0],
      audio_dest.stream.getTracks()[0]
    ]);

    app.capture_stream = stream;
    app.media_recorder_chunks = [];
    app.on_render_done = callback;

    let media_recorder = new MediaRecorder(stream, {
      audioBitsPerSecond : 128000,
      videoBitsPerSecond : 8000000
    });

    this.for_each_textures((t,s) => {
      if(t.isVideo){
        t.videoElement.currentTime = 0;
      }
      if(t.isAudio){
        t.audioElement.currentTime = 0;
      }
    }, false);

    // Leave some time for videos to seek
    setTimeout(function(){
      media_recorder.ondataavailable = function(e){
        if (e.data.size > 0) {
          app.media_recorder_chunks.push(e.data);
        }
      };

      media_recorder.onstop = function(){
        app.on_render_done(app.media_recorder_chunks);
      };

      app.time.time = 0;
      app.last_frame_time = new Date().getTime();
      app.media_recorder = media_recorder;

      media_recorder.start();
      app.paused = false;

    },10);
  }

  get_canvas_blob() {
    let app = this;
    // Thanks to stack overflow
    // https://stackoverflow.com/questions/42458849/
    return new Promise(function(resolve, reject) {
      app.canvas.toBlob(function(blob) {
        resolve(blob)
      }, "image/png")
    });
  }

  gen_vid_id() {
    /* generate random vid id */
    let id = "";

    for(let i = 0; i < 40; i++){
      id += parseInt(Math.random()*10) + "";
    }

    return id;
  }

  async render_hq(callback) {
    /* render high quality video */

    let app = this;
    let duration = this.get_total_duration();
    let fps = this.fps;
    let total_frames = fps * duration;
    let vid_id = this.gen_vid_id();
    let base_path = "";

    if(!this.headless){
      base_path = window.lattefx_settings.cloud;
    }

    for(let frame = 0; frame < total_frames; frame++){
      if(app.cancel_hq_render){
        app.cancel_hq_render = false;
        this.time.time = 0;
        this.pause();
        this.rendering = false;
        return;
      }

      let time = frame / fps;
      this.update_render_status("Rendering a frame");

      if(this.headless){
        await this.draw_gl(time);
        this.image_saver(frame, this.width, this.height);
      } else {
        await this.draw_gl(time);

        let canvasFrame = await this.get_canvas_blob();
        let form = new FormData();

        form.append("frame.png", canvasFrame);

        this.update_render_status("Uploading a frame");
        await fetch(base_path + "/upload_frame/" + vid_id + "/" + frame, {
          method: "POST",
          mode: "cors",
          body: form
        });
      }
    }

    this.time.time = 0;
    this.pause();

    if(this.headless){
      // We are done
      return;
    }

    let form = new FormData();
    form.append("audio-sequences", JSON.stringify(this.export_audio_sequences()));

    this.update_render_status("Server is rendering video");
    let resp = await fetch(base_path + "/render_video/" + vid_id + "/" + fps, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      body: form
    });

    let vidid = await resp.text();

    callback([vidid]);
  }

  export_audio_sequences() {
    let sequences = [];
    for(let i in this.sequences){
      let seq = this.sequences[i];

      if(seq.effect == null){
        continue;
      }

      let effect = seq.effect;
      let textures = effect.shaderProgram.textures;

      if("video" in textures){
        let vid = textures.video;

        if(vid.isVideo){
          sequences.push({
            from: seq.from,
            to: seq.to,
            trimBefore: effect.trimBefore || 0,
            digest: vid.videoDigest
          });
        }
      }

      if("audio" in textures){
        let aud = textures.audio;

        if(aud.isAudio){
          sequences.push({
            from: seq.from,
            to: seq.to,
            trimBefore: effect.trimBefore || 0,
            digest: aud.audioDigest
          });
        }
      }

    }
    return sequences;
  }

  cancel_render() {
    if(this.rendering){
      if(this.renderMode == "LQ"){
        if(this.media_recorder != undefined){
          this.media_recorder.onstop = null;
          this.media_recorder.stop();
        }
        this.time.time = 0;
        this.pause();
        this.rendering = false;
      } else {
        this.cancel_hq_render = true;
      }
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
    for (var i = 0; i < 3; i++) {
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

  clear_transparent() {
    let gl = this.gl;
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  pause_non_current_media(){
    let time = this.time.time;
    for (let i = 0; i < this.sequences.length; i++) {
      let seq = this.sequences[i];
      if(seq.effect == undefined){
        continue
      }
      let pass = seq.effect.shaderProgram;
      if(typeof(pass) == "undefined"){
        continue;
      }
      if (time < seq.from || time > seq.to) {
        for (let tex_index in pass.textures) {
          let t = pass.textures[tex_index];
          if (t.isVideo) {
            t.audioElement.time = 0;
            t.videoElement.time = 0;
            t.audioElement.pause();
            t.videoElement.pause();
          } else if (t.isAudio) {
            t.audioElement.pause();
            t.audioElement.time = 0;
          }
        }
      }
    }
  }

  update_render_status(new_status){
    if(this.headless){
      console.log(new_status);
    } else {
      let nodes = document.querySelectorAll(".render-status");
      nodes.forEach(function(el){
        el.innerText = new_status
      });
    }
  }

  get_sequences_by_layers(only_current){
    let time = this.time.time;

    let maxLayer = 0;

    let sequencesByLayer = [];
    for(let i = 0; i <= 20; i++){
      sequencesByLayer.push([]);
    }

    for(let i = 0; i < this.sequences.length; i++){
      let seq = this.sequences[i];
      if(only_current && time < seq.from || time > seq.to){
        continue;
      }
      let effect = seq.effect;
      let arr = sequencesByLayer[seq.layer];
      if(effect == undefined){
        continue;
      }
      seq.layer = seq.layer || 0;
      sequencesByLayer[seq.layer].push({
        from: seq.from,
        to: seq.to,
        effect: effect,
        pass: effect.shaderProgram,
        uniforms: effect.uniforms,
        trimBefore: effect.trimBefore || 0
      });
      if(seq.layer > maxLayer){
        maxLayer = seq.layer;
      }
    }

    return {maxLayer, sequencesByLayer}
  }

  async draw_gl(force_time) {
    const gl = this.gl;
    let texSuccess = true;

    if (gl == null) {
      return;
    }

    let duration = this.get_total_duration();

    this.pause_non_current_media();

    if(force_time != undefined){
      this.time.time = force_time;
    } else if (!this.paused) {
      let raw_time = new Date().getTime();
      let delta = raw_time - this.last_frame_time;
      this.time.time += delta / 1000.0;
      if (!this.rendering) {
        this.time.time = this.time.time % duration;
      }
      this.last_frame_time = raw_time;
    }

    let time = this.time.time;

    this.on_progress(time, duration);

    if(this.sequences.length == 0){
      return;
    }

    let has_cleared = false;

    let layers_info = this.get_sequences_by_layers(true);
    let maxLayer = layers_info.maxLayer;
    let sequencesByLayer = layers_info.sequencesByLayer;

    let is_first = 1.0;

    let passCounter = 0;
    let layerCounter = 0;

    for (let layer = 0; layer < sequencesByLayer.length; layer++) {
      let sequences = sequencesByLayer[layer];

      for (let sequenceIndex = 0; sequenceIndex < sequences.length; sequenceIndex++) {
        let seq = sequences[sequenceIndex];
        let currentRelativeTime = (time - seq.from) / parseFloat(seq.to - seq.from);
        let shaderProgram = seq.pass;

        if(this.rendering && this.renderMode == "HQ"){
          if( seq.effect != null &&
              seq.effect.plugin != null &&
              seq.effect.plugin.updateTexts != undefined){
            seq.effect.plugin.updateTexts();
          }
        }

        if(shaderProgram == undefined){
          continue;
        }
        shaderProgram.use();
        let program = shaderProgram.program;

        // Render to buffer
        if (layer < maxLayer) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer[this.PREVIOUS_LAYER_0 +(layerCounter % 3)]);
        } else {
          // Render to screen
          // null = screen
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        layerCounter++;

        let i = 0;

        // Also add previous pass
        if (layer > 0) {
          let lastLayerID = this.PREVIOUS_LAYER_0 + ((layerCounter + 1) % 3);
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[lastLayerID]);
          gl.uniform1i(gl.getUniformLocation(program, 'previous_layer'), i);
        } else {
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, null);
          gl.uniform1i(gl.getUniformLocation(program, 'previous_layer'), i);
        }

        i++;

        if (layer > 1) {
          let lastLayerID = this.PREVIOUS_LAYER_0 + ((layerCounter) % 3);
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[lastLayerID]);
          gl.uniform1i(gl.getUniformLocation(program, 'previous_previous_layer'), i);
        } else {
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, null);
          gl.uniform1i(gl.getUniformLocation(program, 'previous_previous_layer'), i);
        }

        i++;

        for(let name in shaderProgram.textures){
          let tex = shaderProgram.textures[name];
          gl.activeTexture(gl.TEXTURE0 + i);
          var att = gl.getUniformLocation(program, name);
          if(tex.isVideo || tex.isAudio){
            // Seek to right time
            let trimBefore = parseFloat(seq.trimBefore);
            let timeFrom = parseFloat(seq.from);
            let shouldBeTime = time - timeFrom + trimBefore;

            if (this.rendering && this.renderMode == "HQ") {
              let timeTo = parseFloat(seq.to);
              // Get exact frame
              if(tex.isVideo){
                await tex.updateVideoHQ(
                  this.fps,
                  trimBefore,
                  timeFrom-trimBefore,
                  shouldBeTime
                );
              }

              // Clear after first instance of a video for a frame
              // This prevent flicker when rendering
              if(!has_cleared){
                this.clear();
                has_cleared = true;
              }
            } else {
              // Get approximate timing
              let mediaElements = [];
              if(tex.isVideo){
                mediaElements.push(tex.videoElement);
                mediaElements.push(tex.audioElement);
              } else if (tex.isAudio) {
                mediaElements.push(tex.audioElement);
              }

              for (let element of mediaElements){
                let currTime = element.currentTime;

                // Attempt: dont sync while rendering
                if (Math.abs(shouldBeTime - currTime) > 2.0) {
                  element.pause();
                  element.currentTime = shouldBeTime;

                  if (!this.paused) {
                    element.play();
                  }
                } else if (this.rendering) {
                  element.play();
                }
              }

              if(tex.isVideo){
                tex.videoElement.muted = true;

                if(seq.effect.muted){
                  tex.audioElement.muted = true;
                } else {
                  tex.audioElement.muted = false;
                }
                texSuccess &= tex.updateVideo();
              }
            }
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
      }
    }

    // Clear if there is nothing at all
    if(!has_cleared && layerCounter == 0){
      this.clear();
    }

    if (this.rendering) {
      if (!texSuccess) {
        return false;
      }

      if (time >= duration && this.renderMode == "LQ") {
        this.media_recorder.stop();
        this.rendering = false;
        this.time.time = 0;
        this.pause();
      }
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
      // Make sure to render when focussed or rendering
      if (player.rendering || player.window_focused) {
        if(player.rendering && player.renderMode == "HQ"){
          // Draw is handled elsewhere
          window.requestAnimationFrame(_animate.bind(this));
          return;
        }
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

if(typeof(module) != "undefined"){
  module.exports = ShaderPlayerWebGL;
}
