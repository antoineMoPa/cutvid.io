/*
  For the history, this file has mostly underscore case
  because it was copied from shadergif's shader player

  Note: I actually downgraded to webgl1 to support more devices
  Note 2: This should be renamed engine or something */

;

class ShaderPlayerWebGL {
  constructor(canvas, gl, width, height) {
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
    this.no_advance_time = false;

    this.cut_left = 0;   // This is used to cut a portion of the viewport
    this.cut_right = 0;
    this.cut_bottom = 0;
    this.cut_top = 0;

    this.width = width || 540;
    this.height = height || 540;
    this.rendering = false;
    this.mouse = [0, 0];

    // Create time object just to be by reference
    this.time = {};
    this.time.time = 0.01;
    this.on_progress = function(progress){};

    this.PREVIOUS_LAYER_0 = 0;
    this.PREVIOUS_LAYER_1 = 1;
    this.PREVIOUS_LAYER_2 = 2;

    this.on_resize_listeners = {};

    this.file_store = new FileStore();

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

    this.expose();

    this.renderMode = "LQ"; /* TEMPORARY */
  }

  reload(){
    utils.load_script("./shader_player_webgl.js?" + Math.random());
    for(let i in ShaderPlayerWebGL.prototype){
      this[i] = ShaderPlayerWebGL.prototype[i];
    }
  }

  test(){
    console.log("a");
  }

  expose(){
    window.API.expose({
      name: "shader_player.get_shader_player",
      doc: `Get Shader Player

        This returns the current shader player instance.
        `,
      fn: function(){
        return this;
      }.bind(this),
      dev_only: true,
      no_ui: true
    });

    window.API.expose({
      name: "shader_player.get_file_store",
      doc: `Get Shader Player

        This returns the current shader player instance.
        `,
      fn: function(){
        return this.file_store;
      }.bind(this),
      dev_only: true
    });

    window.API.expose({
      name: "shader_player.get_total_frames",
      doc: `Get Total Frames

        Get the current total number of frames in the video.
        `,
      fn: function(){
        return parseInt(this.get_total_duration() * this.fps);
      }.bind(this)
    });

    window.API.expose({
      name: "shader_player.render",
      doc: `Render Scene
        `,
      fn: function(){
        this.render();
      }.bind(this)
    });

    window.API.expose({
      name: "shader_player.reload_engine",
      doc: `Reload Shader Engine
        `,
      fn: function(){
        this.reload();
      }.bind(this)
    });

    window.API.expose({
      name: "shader_player.cancel_render",
      doc: `Cancel render
        `,
      fn: function(){
        this.cancel_render();
      }.bind(this),
      no_ui: true
    });
  }

  /*
    Gets all audio streams for recording

    Including videos, which can contain audio
   */
  get_all_audio_streams(){
    let streams = [];

    this.for_each_textures((t,s) => {
      if(t.isAudio && t.audioElement != null){
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
        m.videoElement.muted = m.muted;
        m.videoElement.play().then(function(){
        }).catch(function(error){
          console.log(error);
        });
      } else {
        // Play audio
        try{
          m.audioElement.play();
        } catch (e) {
          console.log(e);
          // Probably no audio here
        }
      }
    });
    this.last_frame_time = new Date().getTime();
  }

  pause(){
    this.paused = true;

    if(this.headless){
      return;
    }

    this.for_each_textures((t,s) => {
      if (t.isVideo || (t.isAudio && t.audioElement != null))
        utils.safe_pause(t.videoElement);
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

  async render(callback) {
    /* render high quality video */

    let app = this;
    let duration = this.get_total_duration();
    let fps = this.fps;
    let total_frames = Math.ceil(fps * duration);
    let vid_id = this.gen_vid_id();
    let base_path = "";

    this.pause();

    this.rendering = true;

    let render_settings = await window.API.call("render_settings.show");

    let MEMFS = [];

    window.API.call("ui.begin_progress");

    for(let frame = 0; frame < total_frames; frame++){
      if(app.cancel_hq_render){
        app.cancel_hq_render = false;
        utils.cancel_workers_by_type("render");
        this.time.time = 0;
        this.pause();
        this.rendering = false;
        return;
      }

      let time = frame / fps;

      window.API.call("ui.set_progress",
                      frame/total_frames * 0.5, // Other half is for encoding
                      "Rendering frame " + frame + " of " + parseInt(total_frames),
                     function(){
                       app.cancel_hq_render = true;
                     });

      await this.draw_gl(time);

      let image_file = await this.get_canvas_blob("image/png");

      MEMFS.push({
        name: `image-${(frame+"").padStart(6,0)}.png`,
        data: await image_file.arrayBuffer()
      });

      console.log("FRAME RENDERED");
    }

    let audio_sequences = window.API.call("player.export_audio_sequences");
    let [audio_args, audio_filter_graph, map_args] = await utils.build_ffmpeg_audio_args(audio_sequences);

    let extension = render_settings.export_file_type;

    let ffmpeg_command = utils.build_ffmpeg_image_to_video_args(
      30,
      audio_args,
      audio_filter_graph,
      map_args,
      extension
    );

    for(let sequence in audio_sequences){
      let name = audio_sequences[sequence].file_name;

      if(this.file_store.files[name] == undefined){
        console.error("Cannot find file " + name + " in file store.");
        continue;
      }

      MEMFS.push({
        name: name,
        data: await this.file_store.files[name].arrayBuffer()
      });
    }

    let frame_regex = /frame=\s*([0-9]*)/;

     window.API.call("ui.set_progress", 0.6, "Beginning video encoding.");

    let result = await utils.run_ffmpeg_task({
      arguments: ffmpeg_command,
      MEMFS,
      message: "Encoding video..."
    }, "render");

    let blob = new Blob([result("readFile", `video.${extension}`)])

    window.API.call("ui.clear_progress");
    window.API.call("download.show", blob, extension);

    this.rendering = false;
    this.time.time = 0;
  }

  cancel_render() {
    this.cancel_hq_render = true;
    this.time.time = 0;
    this.pause();
    this.rendering = false;

    window.API.call(
      "utils.flag_error",
      "Render cancelled."
    );
  }

  render_old(callback) {
    let app = this;

    if(app.canvas.captureStream == undefined){
      alert("Sorry, your browser does not support stream capturing from a canvas element, which is required for LQ renders. Consider updating your browser or switching to another one.");
      app.rendering = false;
      return;
    }

    let video_stream = app.canvas.captureStream(app.fps);
    let audio_streams = app.get_all_audio_streams();

    // https://stackoverflow.com/questions/42138545
    let audio_context = new AudioContext();
    let sources = audio_streams.map((s) => {
      return audio_context.createMediaStreamSource(new MediaStream([s]))
    });

    let audio_dest = audio_context.createMediaStreamDestination();

    sources.forEach((s) => {
      s.connect(audio_dest)
    });

    let stream = null;

    if("webkitMediaStream" in window){
      // Chrome
      // https://stackoverflow.com/questions/36093376/
      var outputTracks = [];
      outputTracks = outputTracks.concat(video_stream.getTracks());
      if(audio_streams.length > 0){
        outputTracks = outputTracks.concat(audio_dest.stream.getTracks());
      }
      stream = new webkitMediaStream(outputTracks);
    } else {
      stream = new MediaStream([
        video_stream.getTracks()[0],
        audio_dest.stream.getTracks()[0]
      ]);
    }

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
      if(t.isAudio && t.audioElement != null){
        t.audioElement.currentTime = 0;
      }
    }, false);

    // Leave some time for videos to seek
    setTimeout(function(){
      media_recorder.onstop = function(){
        app.on_render_done(app.media_recorder_chunks);
      };

      media_recorder.ondataavailable = function(e){
        if (e.data.size > 0) {
          app.media_recorder_chunks.push(e.data);
        }
      };

      app.time.time = 0;
      app.last_frame_time = new Date().getTime();
      app.media_recorder = media_recorder;

      media_recorder.start();
      app.paused = false;

    }, 10);
  }

  get_canvas_blob(format) {
    let app = this;
    // Thanks to stack overflow
    // https://stackoverflow.com/questions/42458849/
    return new Promise(function(resolve, reject) {
      app.canvas.toBlob(function(blob) {
        resolve(blob)
      }, format)
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

  export_audio_sequences() {
    let sequences = [];
    for(let i in this.sequences){
      let seq = this.sequences[i];

      if(seq.effect == null){
        continue;
      }

      let effect = seq.effect;
      let textures = effect.shaderProgram.textures;

      if ("muted" in effect){
        if(effect["muted"]){
          continue;
        }
      }

      if("video" in textures){
        let vid = textures.video;

        if(vid.isVideo){
          sequences.push({
            from: seq.from,
            to: seq.to,
            trimBefore: effect.trimBefore || 0,
            digest: vid.videoDigest,
            file_name: textures.video.url,
            volume: effect.uniforms.volume.value
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
            digest: aud.audioDigest,
            file_name: textures.audio.url,
            volume: effect.uniforms.volume.value
          });
        }
      }

    }
    return sequences;
  }

  attach_textures(){
    /* saves textures as data URLS
       useful for headless render */
    for(let s in this.sequences){
      let seq = this.sequences[s];

      if(seq.effect == undefined || seq.effect.shaderProgram == undefined){
        return;
      }

      let pass = seq.effect.shaderProgram;

      seq.texture_urls = {};

      for(let t in pass.textures){
        let tex = pass.textures[t];

        if(tex.url == undefined){
          continue;
        }

        seq.texture_urls[t] = tex.url;
      }
    }
  }

  attach_uniforms(){
    /* Saves current uniforms
       useful for headless render */

    for(let s in this.sequences){
      let seq = this.sequences[s];

      if(seq.effect == undefined || seq.effect.uniforms == undefined){
        return;
      }
      seq.saved_uniforms = JSON.parse(JSON.stringify(seq.effect.uniforms));
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
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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
    let vertices = [
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

  pause_non_current_media(current_medias){
    let time = this.time.time;
    let videos = Object.keys(this.file_store.video_elements);
    let audios = Object.keys(this.file_store.audio_elements);
    let medias = videos.concat(audios);

    for(let media in medias){
      let key = medias[media];
      if(current_medias.indexOf(key) == -1){
        if (key in this.file_store.video_elements) {
          utils.safe_pause(this.file_store.video_elements[key]);
        }
        if(key in this.file_store.audio_elements){
          utils.safe_pause(this.file_store.audio_elements[key]);
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

    let sequencesByLayer = [];
    for(let i = 0; i <= 20; i++){
      sequencesByLayer.push([]);
    }

    for(let i = 0; i < this.sequences.length; i++){
      let seq = this.sequences[i];

      if(only_current){
        if(time < seq.from || time > seq.to){
          continue;
        }
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
    }

    // delete empty layers
    for(let i = sequencesByLayer.length - 1; i > 0; i--){
      if(sequencesByLayer[i].length == 0){
        sequencesByLayer.splice(i, 1);
      }
    }

    let maxLayer = sequencesByLayer.length - 1;

    return {maxLayer, sequencesByLayer}
  }

  async draw_gl(force_time) {
    const gl = this.gl;
    let texSuccess = true;

    if (gl == null) {
      return;
    }

    let duration = this.get_total_duration();
    let current_medias = [];

    if(force_time != undefined){
      this.time.time = force_time;
    } else if (!this.paused) {
      let raw_time = new Date().getTime();
      let delta = raw_time - this.last_frame_time;
      this.time.time += delta / 1000.0 * (this.no_advance_time? 0.0: 1.0);
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

        if(shaderProgram == undefined){
          continue;
        }

        shaderProgram.use();
        let program = shaderProgram.program;

        // Render to buffer
        if (layer < maxLayer) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer[this.PREVIOUS_LAYER_0 +(layerCounter % 3)]);
          gl.clear(gl.DEPTH_BUFFER_BIT);
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

            current_medias.push(tex.url);

            if(this.rendering && tex.isVideo){
              await tex.update_video_hq(
                this.fps,
                trimBefore,
                timeFrom - trimBefore,
                shouldBeTime,
                seq.to - seq.from
              ).catch((e) => {
                console.log("Error in video update.", e)
              });
            } else {
              // Get approximate timing
              let mediaElements = [];
              if(tex.isVideo){
                // Update muted status
                if(shaderProgram.muted != tex.videoElement.muted){
                  tex.videoElement.muted = shaderProgram.muted;
                }
                tex.videoElement.volume = seq.uniforms.volume.value;
                mediaElements.push(tex.videoElement);
              } else if (tex.isAudio) {
                tex.audioElement.volume = seq.uniforms.volume.value;
                mediaElements.push(tex.audioElement);
              }

              for (let element of mediaElements){
                let currTime = element.currentTime;

                if (Math.abs(shouldBeTime - currTime) > 0.2) {
                  console.warn("Out of sync.");
                  utils.safe_pause(element);

                  let time_at_seek = this.time.time;
                  this.no_advance_time = true;

                  let afterSeek = () => {

                    element.play().catch((e) => {
                      console.error(e);
                    }).then(() => {
                      if (this.paused) {
                        element.pause();
                      }
                    });

                    this.no_advance_time = false;
                    this.time.time = time_at_seek;
                  };

                  element.currentTime = shouldBeTime;

                  if (!element.seeking) {
                    afterSeek();
                  } else {
                    element.addEventListener("seeked", function() {
                      afterSeek();
                    }.bind(this), {once: true});
                  }
                }

                if (element.paused && !this.paused) {
                  element.play();
                }
              }

              if(tex.isVideo){
                texSuccess &= tex.updateVideo();
              }
            }
          } else {
            gl.bindTexture(gl.TEXTURE_2D, tex.texture);
          }

          gl.uniform1i(att, i);
          i++;

          att = gl.getUniformLocation(program, "flip_tex");

          if(this.headless){
            gl.uniform1f(att, 1.0);
          } else {
            gl.uniform1f(att, 0.0);
          }
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


        // Screen ratio
        let ratio = 0.0

        if(seq.effect.effectName == "video"){
          ratio = (this.width - this.cut_left) /
            (this.height - this.cut_bottom + this.cut_top);
        } else {
          ratio = this.width / this.height;
        }

        const ratioAttribute = gl.getUniformLocation(program, 'ratio');
        gl.uniform1f(ratioAttribute, ratio);

        for(let name in seq.uniforms){
          let uni = seq.uniforms[name];
          let attribute = gl.getUniformLocation(program, name);

          if(uni.type == "f"){
            gl.uniform1f(attribute, parseFloat(uni.value));
          }
        }

        att = gl.getUniformLocation(program, 'y_scale');
        let y_scale = (this.height - this.cut_bottom) / this.height;
        gl.uniform1f(att, y_scale);

        att = gl.getUniformLocation(program, 'x_scale');
        let x_scale = (this.width - this.cut_right) / this.width;
        gl.uniform1f(att, x_scale);

        let original_w = this.width;
        let original_h = this.height;
        let w_cut = this.width - this.cut_left;
        let h_cut = this.height - this.cut_bottom + this.cut_top;

        if(seq.effect.effectName == "video"){
          original_w = this.width  + this.cut_right;

          gl.viewport(
            this.cut_left,
            this.cut_bottom,
            w_cut,
            h_cut
          );
        } else {
          gl.viewport(
            0,0,
            original_w,
            original_h
          );
        }

        gl.uniform2fv(
          gl.getUniformLocation(program, 'center'),
          [
            (original_w/2-this.cut_left)/w_cut,
            (original_h/2-this.cut_bottom)/h_cut
          ]
        );

        try{
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        } catch (e) {
          console.log(e);
        }
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
        if (false) { // old render mode
          this.media_recorder.stop();
        }
        this.rendering = false;
        this.time.time = 0;
        this.pause();
      }
    }

    this.pause_non_current_media(current_medias);

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

      if (!player.rendering){
        // Make sure to render when focussed
        if (player.window_focused) {
          try{
            player.draw_gl();
          } catch (e) {
            console.error(e);
          }
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
