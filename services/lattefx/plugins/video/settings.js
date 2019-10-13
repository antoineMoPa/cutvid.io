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

</div>`,
        data: function(){
          return {
            video: null,
            videoName: "",
            error: false,
            backgroundColor: "#000000",
            trimBefore: 0,
            durationInitialized: false,
            player: null,
            effect: null,
            shaderProgram: null,
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
          loadVideo(data){
            let app = this;
            app.durationInitialized = false;
            this.shaderProgram.set_texture('video', '', function(){}, {
              video: data,
              autoplay: !this.player.paused,
              onerror: function(){
                app.error = true;
              },
              ready: function(){
                // "this" points to <video> element
                app.uniforms.videoWidth.value = this.videoWidth;
                app.uniforms.videoHeight.value = this.videoHeight;
                app.videoElement = this;

                if(!app.durationInitialized){
                  app.onDuration(this.duration);
                  // Don't resize video after initial resize
                  app.durationInitialized = true;
                }
              }
            });
          },
          onVideo() {
            const app = this;
            const input = this.$el.querySelectorAll('.video-file-input')[0];

            try {
              const file = input.files[0];
              app.videoFile = file;
              app.video = window.URL.createObjectURL(file);
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
            this.loadVideo(this.video);
          },
          trimBefore(){
            this.effect.trimBefore = this.trimBefore;
          },
          videoFile(){
            this.effect.videoFile = this.videoFile;
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
