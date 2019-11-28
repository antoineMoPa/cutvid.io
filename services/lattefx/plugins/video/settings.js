/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "video";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Video",
      ui: {
        template: `
<div>
  <label>Your Video</label>
  <input type="file" accept=".mp4,.avi,.mov,.webm,.ogv,.ogg" class="video-file-input" v-on:change="onVideo()">
  <div v-if="video != null">
    <label>Download source video to computer</label>
    <a class="button" v-bind:href="video" download><button>Download</button></a>
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
  <label>Trim Before (seconds)<br>
    <input v-model="trimBefore" step="any" min="0" type="number">
  </label>

  <label>Mute sound
    <input v-model="muted" type="checkbox">
  </label>

</div>`,
        data: function(){
          return {
            serializeExclude: ["video", "videoFile"],
            video: null,
            videoFile: null,
            videoFileB64: null,
            videoName: "",
            error: false,
            backgroundColor: "#000000",
            trimBefore: 0,
            durationInitialized: false,
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
          loadVideo(){
            let app = this;
            app.error = false;
            this.shaderProgram.set_texture('video', '', function(){}, {
              video: this.video,
              videoFile: this.videoFile,
              autoplay: !this.player.paused,
              onerror: function(){
                app.error = true;
                fetch("/stats/lattefx_app_video_has_error/");
              },
              ready: function(){
                // "this" points to <video> element
                app.uniforms.videoWidth.value = this.videoWidth;
                app.uniforms.videoHeight.value = this.videoHeight;
                app.videoElement = this;
                if(!app.durationInitialized){
                  app.onDuration(this.duration);
                  fetch("/stats/lattefx_app_video_duration/"+parseInt(this.duration));
                  // Don't resize video after initial resize
                  app.durationInitialized = true;
                }
              }
            });
          },
          onVideo(videoToLoad) {
            const app = this;
            const input = this.$el.querySelectorAll('.video-file-input')[0];

            try {
              let file = null;
              if(typeof(videoToLoad) != "undefined"){
                file = videoToLoad;
              } else {
                file = input.files[0];
              }
              app.videoFile = file;
              app.video = window.URL.createObjectURL(file);

              if(app.videoFileB64 == null){
                utils.file_to_base64(file).then((result)=>{
                  app.videoFileB64 = result;
                });
              }
            } catch (e) {
              // Well I guess you are using a dumb browser
              console.error(e);
            }
          },
          onTrimLeft(diff){
            this.trimBefore += diff;
          }
        },
        watch: {
          video(){
            this.loadVideo();
          },
          trimBefore(){
            this.effect.trimBefore = this.trimBefore;
          },
          videoFile(){
            this.effect.videoFile = this.videoFile;
          },
          muted(m){
            this.effect.muted = m;
          },
          effect(){
            this.effect.muted = this.muted;
          },
          videoFileB64(){
            let app = this;
            fetch(this.videoFileB64).then((result) => {
              result.blob().then((result) => {
                let file = new File([result], "video.vid");
                app.durationInitialized = true;
                app.onVideo(file);
              });
            });
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
