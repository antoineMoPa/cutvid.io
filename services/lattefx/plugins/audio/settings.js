/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "audio";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Audio",
      ui: {
        template: `
<div>
  <label>Your file</label>
  <input type="file" accept=".mp3,.wav,.ogg,.aac,.flac" class="audio-file-input" v-on:change="onAudio()">
  <p v-if="error">ERROR: Your browser does not seem to support this audio file encoding.<br>
  </p>
  <label>Trim Before (seconds)<br>
    <input v-model="trimBefore" step="any" min="0" type="number">
  </label>
</div>`,
        data: function(){
          return {
            serializeExclude: ["audio", "audioFile", "effect"],
            audio: null,
            audioFile: null,
            audioFileB64: null,
            audio_media_id: null,
            audioName: "",
            error: false,
            backgroundColor: "#000000",
            trimBefore: 0,
            durationInitialized: false,
            player: null,
            effect: null,
            shaderProgram: null,
            uniforms: {}
          };
        },
        methods: {
          loadAudio(){
            let app = this;
            app.error = false;

            this.shaderProgram.set_texture('audio', '', function(){}, {
              audio: this.audio,
              audioFile: this.audioFile,
              autoplay: !this.player.paused,
              audio_media_getter: this.media_getter,
              audio_media_id: this.audio_media_id,
              onerror: function(){
                app.error = true;
                fetch("/stats/lattefx_app_audio_has_error/");
              },
              ready: function(){
                // "this" points to <audio> element
                app.audioElement = this;

                if(!app.durationInitialized){
                  app.onDuration(this.duration);
                  fetch("/stats/lattefx_app_audio_duration/"+parseInt(this.duration));
                  // Don't resize audio after initial resize
                  app.durationInitialized = true;
                }
              }
            });
          },
          onAudio(audioToLoad) {
            const app = this;
            const input = this.$el.querySelectorAll('.audio-file-input')[0];

            try {
              let file = null;
              if(typeof(audioToLoad) != "undefined"){
                file = audioToLoad;
              } else {
                file = input.files[0];
              }
              app.audioFile = file;
              app.audio = window.URL.createObjectURL(file);

              if(app.audioFileB64 == null){
                utils.file_to_base64(file).then((result)=>{
                  app.audioFileB64 = result;
                });
              }
            } catch (e) {
              // Well I guess you are using a dumb browser
              console.error(e);
            }
          },
          async media_getter(){
            if(this.audio_media_id == null){
              return window.URL.createObjectURL(options.audioFile);
            } else {
              let settings = window.lattefx_settings;
              let cloud_url = settings.cloud;
              let auth = window.auth;
              let token = await auth.get_token();
              let project_id = window.player.project_id;
              let project_media_url = cloud_url + "/media/" + project_id + "/";
              let req = await fetch(project_media_url + this.audio_media_id, {
                headers: {
                  'Authorization': 'Bearer ' + token,
                }
              });

              let blob = await req.blob();
              let url = window.URL.createObjectURL(blob);

              return url;
            }
          },
          onTrimLeft(diff){
            this.trimBefore += diff;
            // Don't trim negatively:
            this.trimBefore = Math.max(this.trimBefore, 0.0);
          }
        },
        watch: {
          audio(){
            this.loadAudio();
          },
          trimBefore(){
            this.effect.trimBefore = this.trimBefore;
          },
          audioFile(){
            this.effect.audioFile = this.audioFile;
          },
          audioFileB64(){
            let app = this;

            if(this.audioFileB64 == ""){
              return;
            }

            fetch(this.audioFileB64).then((result) => {
              result.blob().then((result) => {
                let file = new File([result], "audio.vid");
                app.durationInitialized = true;
                app.onAudio(file);
              });
            });
          }
        },
        mounted(){

        },
        beforeDestroy(){
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
