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
  <label>Video Scale</label>
  <input type="number" v-model="uniforms.videoScale.value" min="0.0" max="2.0" step="0.05">
  <label>Offset the video X, Y</label>
  <input v-model.number="uniforms.offsetLeft.value" type="number" size="4" step="0.01">
  <input v-model.number="uniforms.offsetTop.value" type="number" size="4" step="0.01">
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
                value: 1,
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
            let options = {};
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
          build_preview(){
            let api = window.API;
            // We'll use this function to cancel last call if exists
            let cancel_last = function(){};

            api.call(
              "sequencer.set_sequence_preview_maker",
              this.effect.id,
              async function(width, height, from, to, updater){
                if(this.preview_canvas == undefined){
                  // Keep reusing the same canvas
                  this.preview_canvas = document.createElement("canvas");
                }

                let can = this.preview_canvas;
                let ctx = can.getContext("2d");

                let old_image = can.toDataURL();

                // Send initial version
                // Generally this will be last rendered version
                // when a re render of the preview is triggered
                // by a sequencer move, zoom or sequence resize
                updater(can);

                // Note: changing dims trigger canvas erasure
                can.width = width;
                can.height = height;

                await new Promise(function(resolve){
                  let image = new Image();
                  image.onload = function(){
                    ctx.drawImage(image,0,0);
                    resolve();
                  };
                  image.src = old_image;
                });

                let cancel = false;

                cancel_last();

                cancel_last = function(){
                  cancel = true;
                };

                ctx.fillStyle = "#000000";

                let original_video = this.shaderProgram.textures.video.videoElement;
                let video = document.createElement("video");
                video.width = 40/16*9;
                video.height = 40;
                video.src = original_video.src;

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

                let num = parseInt(to - from) + 1;

                for(let i = 0; i <= num; i++){
                  let seek_to = (to - from)/num * i;

                  if(cancel){
                    return;
                  }

                  if(seek_to - this.trimBefore > video.duration){
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(parseInt(video.duration/(to-from)*width), 0, width, 40);
                    updater(can);
                    break;
                  } else {
                    if(video.currentTime != seek_to){
                      video.currentTime = seek_to + this.trimBefore;
                      await wait_seek();
                    }

                    ctx.drawImage(video, width/num*(i-1), 0, width/num, 40);
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
            this.file_name = name;

            this.shaderProgram.set_texture('video', name, this.video_ready);
          },
          onTrimLeft(diff){
            this.trimBefore += diff;
          },
          video_ready(video){
            // "this" points to <video> element
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
          file_name(){
            this.shaderProgram.set_texture('video', this.file_name, this.video_ready);
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
