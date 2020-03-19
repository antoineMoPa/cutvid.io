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
  <div class="video-option">
    <label>Upload existing</label>

    <button v-on:click="browse_file">Upload Video</button>
    <input type="file"
           accept=".mp4,.avi,.mov,.webm,.ogv,.ogg,.vid"
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
  <label>Mute sound
    <input v-model="muted" type="checkbox">
  </label>
  <div v-if="video != null">
    <label>Download source video to computer</label>
    <a class="button" v-bind:href="video" download><button>Download</button></a>
  </div>
</div>`,
        data: function(){
          return {
            serializeExclude: ["effect", "shaderProgram"],
            recording: false,
            video: null,
            videoFile: null,
            videoFileB64: null,
            video_media_id: "",
            videoName: "",
            error: false,
            backgroundColor: "#000000",
            trimBefore: 0,
            durationInitialized: false,
            durationSent: false,
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
                this.onVideo(e.data);
                this.recording = false;
              }
            }.bind(this);

            media_recorder.start();
          },
          loadVideo(){
            let app = this;

            app.error = false;

            this.shaderProgram.set_texture('video', '', function(){}, {
              video: this.video,
              videoFile: this.videoFile,
              video_media_getter: this.media_getter,
              video_media_id: this.video_media_id,
              autoplay: !this.player.paused,
              onerror: function(error){
                app.error = true;

                if(this.videoFile != null){
                  fetch("/stats/lattefx_app_video_has_error/" + this.videoFile.name);
                } else {
                  fetch("/stats/lattefx_app_video_has_error/" + this.video_media_id)
                }
              },
              ready: function(){
                // "this" points to <video> element
                app.uniforms.videoWidth.value = this.videoWidth;
                app.uniforms.videoHeight.value = this.videoHeight;
                app.videoElement = this;

                if(!app.durationSent){
                  app.onDuration(this.duration);
                  app.durationSent = true;
                  fetch("/stats/lattefx_app_video_duration/"+parseInt(this.duration));
                }

                // Don't resize video after initial resize
                app.durationInitialized = true;
              }
            });
          },
          browse_file(){
            this.$el.querySelectorAll(".video-file-input")[0].click();
          },
          on_video_upload(){
            let app = this;
            const input = this.$el.querySelectorAll('.video-file-input')[0];
            file = input.files[0];
            app.videoFile = file;
            app.video = window.URL.createObjectURL(file);

            utils.file_to_base64(file).then((result)=>{
              app.videoFileB64 = result;
            });

            app.video_media_id = "";
            app.loadVideo();
          },
          onVideo(videoToLoad) {
            const app = this;

            try {
              let file = null;
              if(typeof(videoToLoad) != "undefined"){
                file = videoToLoad;
              } else {
                return;
              }
              app.videoFile = file;
              app.video = window.URL.createObjectURL(file);

              if(app.videoFileB64 == null){
                utils.file_to_base64(file).then((result)=>{
                  app.videoFileB64 = result;
                });
              }
              app.loadVideo();
            } catch (e) {
              // Well I guess you are using a dumb browser
              console.error(e);
            }
          },
          onTrimLeft(diff){
            this.trimBefore += diff;
          },
          async media_getter(){
            if (this.video_media_id != "") {

              let settings = window.lattefx_settings;
              let cloud_url = settings.cloud;
              let auth = window.auth;
              let token = await auth.get_token();
              let project_id = window.player.project_id;
              let project_media_url = cloud_url + "/media/" + project_id + "/";
              let url = project_media_url + this.video_media_id + "/" + token;
              let req = await fetch(url);
              let blob = await req.blob();
              let blob_url = window.URL.createObjectURL(blob);

              return blob_url;
            } else if (this.video != "") {
              return this.video;
            } else if(this.videoFile != null){
              let reader = new FileReader();
              let url = await reader.readAsDataURL(this.videoFile);
              return url;
            } else if(this.videoFileB64 != ""){

            }
          }
        },
        watch: {
          trimBefore(){
            this.effect.trimBefore = this.trimBefore;
          },
          videoFile(){
            this.effect.videoFile = this.videoFile;
          },
          videoFileB64(){
            let app = this;

            fetch(app.videoFileB64).then((result) => {
              result.blob().then((result) => {
                let file = new File([result], "video.vid");
                app.durationInitialized = true;
                app.durationSent = false;
                app.onVideo(file);
              });
            });
          },
          muted(m){
            this.effect.muted = m;
          },
          effect(){
            this.effect.muted = this.muted;
          },
          video_media_id(media_id){
            this.loadVideo();
          }
        },
        mounted(){

        },
        beforeDestroy(){
          this.shaderProgram.delete_texture('video');
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
