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
  <h4>Video</h4>
  <label>Your Video</label>
  <input type="file" accept=".mp4,.avi,.mov,.webm,.ogv,.ogg" class="video-file-input" v-on:change="onVideo()">
  <label>Video Scale</label>
  <input type="number" v-model="uniforms.videoScale.value" min="0.0" max="2.0" step="0.05">
  <label>Offset Top</label>
  <input v-model.number="uniforms.offsetTop.value" type="number" size="4" step="0.05">
  <label>Offset Left</label>
  <input v-model.number="uniforms.offsetLeft.value" type="number" size="4" step="0.05">

</div>`,
        data: function(){
          return {
            video: null,
            videoName: "",
            backgroundColor: "#000000",
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
        props: ["player", "effect", "shaderProgram"],
        methods: {
          loadVideo(data){
            let app = this;
            this.shaderProgram.set_texture('video', '', function(){}, {
              video: data,
              ready: function(){
                // "this" points to <video> element
                app.uniforms.videoWidth.value = this.videoWidth;
                app.uniforms.videoHeight.value = this.videoHeight;
              }
            });
          },
          onVideo() {
            const app = this;
            const input = this.$el.querySelectorAll('.video-file-input')[0];

            try {
              const file = input.files[0];
              app.video = window.URL.createObjectURL(file);
            } catch (e) {
              // Well I guess you are using a dumb browser
              console.error(e);
            }
          },
        },
        watch: {
          video(){
            this.loadVideo(this.video);
          }
        },
        mounted(){
          this.effect.uniforms = this.uniforms;
        },
        beforeDestroy(){
          this.shaderProgram.delete_texture('video');
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
