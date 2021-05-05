{
  let name = "video";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Video",
      ui: {
        template: `
<div>
  <div class="record-block" v-if="recording">
    Recording
    <button v-on:click="stop_recording"
            class="stop-recording-button animated infinite flash">
      Stop Recording
    </button>
  </div>
  <br v-if="recording"/>
  <div class="video-option">
    <label>Upload existing</label>

    <button v-on:click="browse_file">Upload Video</button>
    <input type="file"
           accept=".mp4,.avi,.mov,.webm,.ogv,.ogg,.vid,.gif"
           class="video-file-input hidden" v-on:change="on_video_upload()">
  </div>
  <div class="video-option">
    <label>Screen Grab</label>

    <button v-on:click="record_screen">Record Screen</button>
  </div>
  <p v-if="error">ERROR: Your browser does not seem to support this video file encoding.<br>
  You can try converting it to .ogv at:<br>
    <a href="https://video.online-convert.com/convert-to-ogv"
       target="_blank">online-convert.com
    </a>
  </p>
  <div v-if="file_name != null" style="margin-top:5px;">
    <a v-on:click="download">Download Source Video</a>
  </div>
  <label>Video Scale</label>
  <input type="number" v-model="uniforms.videoScale.value" min="0.0" max="2.0" step="0.05">
  <label>Sound Volume</label>
  <input type="number" v-model="uniforms.volume.value" min="0.0" max="1.0" step="0.1">
  <label>Offset the video X, Y</label>
  <input v-model.number="uniforms.offsetLeft.value" type="number" size="5" step="0.01">
  <input v-model.number="uniforms.offsetTop.value" type="number" size="5" step="0.01">
  <label>Opacity</label>
  <input v-model.number="uniforms.opacity.value" type="number" size="4" step="0.1">
  <label>Rotation</label>
  <input v-model.number="uniforms.rotate_angle.value" type="number" size="0" step="45">
  <label>Mute sound
    <input v-model="muted" type="checkbox">
  </label>
</div>`,
        data: function(){
          return {
            serializeExclude: ["effect", "shaderProgram"],
            file_name: null,
            recording: false,
            error: false,
            backgroundColor: "#000000",
            trimBefore: 0,
            durationInitialized: false,
            duration_sent: false,
            preview_built: false,
            player: null,
            effect: null,
            shaderProgram: null,
            muted: false,
            uniforms: {
              videoWidth: {
                type: "f",
                len: 1,
                value: 1,
              },
              videoHeight: {
                type: "f",
                len: 1,
                value: 1,
              },
              videoScale: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              offsetTop: {
                type: "f",
                len: 0,
                value: 0,
              },
              offsetLeft: {
                type: "f",
                len: 0,
                value: 0,
              },
              opacity: {
                type: "f",
                len: 0,
                value: 0,
              },
              isLoaded: {
                type: "f",
                len: 0,
                value: 1.0,
              },
              rotate_angle: {
                type: "f",
                len: 0,
                value: 0,
              },
              volume: {
                type: "f",
                len: 0,
                value: 1,
              }
            }
          };
        },
        methods: {
          stop_recording(){
            if(this.on_stop_recording != undefined){
              this.on_stop_recording();
            }
          },
          async record_screen(){
            let options = {video: true, audio:true};
            let capture_stream = null;

            try {
              capture_stream = await navigator.mediaDevices.getDisplayMedia(options);
            } catch(err) {
              window.alert("Error: " + err);
            }

            let media_recorder = new MediaRecorder(capture_stream, {});
            this.recording = true;

            let media_recorder_chunks = [];

            media_recorder.onstop = function(){
              this.recording = false;
            };

            this.on_stop_recording = function(){
              let tracks = capture_stream.getTracks();
              tracks.forEach(track => track.stop());
            }.bind(this);

            media_recorder.ondataavailable = function(e){
              if (e.data.size > 0) {
                let rand_id = Math.floor(Math.random()*10000000);
                let name = "video-recording-" + rand_id + ".video";
                this.file_store.files[name] = e.data;
                this.file_name = name;
                this.shaderProgram.set_texture('video', name, this.video_ready);
                this.uniforms.isLoaded.value = 1.0;
                this.recording = false;
              }
            }.bind(this);

            media_recorder.start();
          },
          browse_file(){
            this.$el.querySelectorAll(".video-file-input")[0].click();
          },
          async build_preview(){

            if (!config.features.video_preview)
              return;

            let api = window.API;

            if (api.call("sequencer.are_previews_disabled")){
              return;
            }

            // Necessary when unserializing
            await this.file_store.get_video(this.file_name);

            // We'll use this function to cancel last call if exists
            let cancel_last = function(){};

            api.call(
              "sequencer.set_sequence_preview_maker",
              this.effect.id,
              async function(width, height, sequence_from, sequence_to, updater){
                if(this.small_version == undefined){
                  return;
                }

                let video = this.small_version;

                if(this.preview_canvas == undefined){
                  // Keep reusing the same canvas
                  this.preview_canvas = document.createElement("canvas");
                }

                let can = this.preview_canvas;
                let ctx = can.getContext("2d");

                // Note: changing dims trigger canvas erasure
                can.width = width;
                can.height = height;

                let cancel = false;

                cancel_last();

                cancel_last = function(){
                  cancel = true;
                };

                // Erase last version a bit
                ctx.fillStyle = "rgba(0,0,0,0.8)";
                ctx.fillRect(0,0,can.width, can.height);

                function wait_seek(){
                  return new Promise(function(resolve){
                    let listener = function(){
                      resolve();
                      video.removeEventListener("timeupdate", listener);
                    };
                    video.addEventListener("timeupdate", listener);

                    setTimeout(listener, 10000);
                  });
                }

                // Get total visible range of sequencer
                let sequencer_range = window.API.call("sequencer.get_visible_time_range");

                // Determine where we must render previews
                let sequence_visible_from = Math.max(sequencer_range.from, sequence_from);
                let sequence_visible_to = Math.min(sequencer_range.to, sequence_to);
                let sequence_visible_duration = sequence_visible_to - sequence_visible_from;
                let sequence_duration = sequence_to - sequence_from;

                let sequencer_total_visible_duration = sequencer_range.to - sequencer_range.from;
                let previews_per_second = 1.0/(sequencer_total_visible_duration);

                let delta_time = sequencer_total_visible_duration * 0.04;
                let delta_px = delta_time * sequencer_range.time_scale;

                for(let t = 0; t <= sequence_duration; t += delta_time){
                  let seek_to = t + this.trimBefore;
                  let x = t * sequencer_range.time_scale - delta_px/2.0;

                  if(cancel){ return; }

                  if(seek_to - this.trimBefore > video.duration){
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(parseInt(x), 0, width, 40);
                    updater(can);
                    break;
                  } else {
                    if(video.currentTime != seek_to){
                      video.currentTime = seek_to;
                      await wait_seek();
                      if(cancel){ return; }
                    }

                    ctx.drawImage(video, x, 0, delta_px, 40);
                    updater(can);
                  }
                }

              }.bind(this)
            );
          },
          async on_video_upload(){
            let app = this;
            const input = this.$el.querySelectorAll('.video-file-input')[0];
            let file = input.files[0];
            let name = file.name;

            this.duration_sent = false;
            this.preview_built = false;

            if(name.indexOf(".gif") != -1){
              file = await utils.gif_to_video(file);
              name = name + ".mp4";
            }

            this.file_store.files[name] = file;
            this.uniforms.isLoaded.value = 1.0;
            this.uniforms.opacity.value = 1.0;
            this.file_name = name;

            this.shaderProgram.set_texture('video', name, this.video_ready);
          },
          download(){
            var link = document.createElement("a");
            link.href = URL.createObjectURL(this.file_store.files[this.file_name]);
            link.download = "cutvidio-video-source-" + this.file_name;
            link.click();
          },
          onTrimLeft(diff){
            this.trimBefore += diff;
          },
          async video_ready(video){
            this.uniforms.videoWidth.value = video.videoWidth;
            this.uniforms.videoHeight.value = video.videoHeight;

            if(!this.duration_sent){
              this.onDuration(video.duration);
              this.duration_sent = true;
            }

            if(!this.preview_built){
              this.build_preview();
              this.preview_built = true;
            }

            // Don't resize video after initial resize
            this.durationInitialized = true;
          }
        },
        watch: {
          trimBefore(){
            this.effect.trimBefore = this.trimBefore;
          },
          effect(){
            this.shaderProgram.muted = this.muted;
          },
          muted(){
            this.shaderProgram.muted = this.muted;
          },
          async file_name(file_name){
            this.shaderProgram.set_texture('video', this.file_name, this.video_ready);

            let api = window.API;

            if (api.call("sequencer.are_previews_disabled")){
              return;
            }

            // Necessary when unserializing:
            await this.file_store.get_video(file_name);

            if (!config.features.video_preview)
              return;

            let small_version = await api.call(
              "utils.make_small_video",
              this.file_store.files[file_name],
              file_name
            );

            if(small_version == null){
              // We called the video generator too soon
              return;
            }

            let small_video = document.createElement("video");
            small_video.loop = false;
            small_video.muted = true;
            small_video.src = URL.createObjectURL(small_version);
            this.small_version = small_video;

            this.build_preview();
          }
        },
        mounted(){
          this.file_store = window.API.call("shader_player.get_file_store");
        },
        beforeDestroy(){
          this.shaderProgram.delete_texture('video');
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
