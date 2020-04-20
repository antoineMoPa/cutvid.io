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
  <button v-on:click="browse_file">Upload File</button>
  <input type="file" accept=".mp3,.wav,.ogg,.aac,.flac" style="display:none;" class="audio-file-input" v-on:change="on_audio_upload()">
  <p v-if="error">ERROR: Your browser does not seem to support this audio file encoding.<br>
  </p>
  <label>Trim Before (seconds)<br>
    <input v-model="trimBefore" step="any" min="0" type="number">
  </label>
</div>`,
        data: function(){
          return {
            serializeExclude: ["effect", "shaderProgram"],
            file_name: null,
            recording: false,
            error: false,
            trimBefore: 0,
            durationInitialized: false,
            durationSent: false,
            player: null,
            effect: null,
            shaderProgram: null,
            muted: false,
            uniforms: {}
          };
        },
        methods: {
          stop_recording(){
            if(this.on_stop_recording != undefined){
              this.on_stop_recording();
            }
          },
          async record_mic(){
            // TODO
            return;
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
                // Generate a random name to avoid collisions
                let rand_id = Math.floor(Math.random()*10000000);
                let name = "audio-recording-" + rand_id + ".audio";

                this.file_store.files[name] = e.data;
                this.file_name = name;

                this.shaderProgram.set_texture('audio', name, this.audio_ready);
                this.recording = false;
              }
            }.bind(this);

            media_recorder.start();
          },
          browse_file(){
            this.$el.querySelectorAll(".audio-file-input")[0].click();
          },
          on_audio_upload(){
            let app = this;
            const input = this.$el.querySelectorAll('.audio-file-input')[0];
            let file = input.files[0];
            let name = file.name;

            this.file_store.files[name] = file;
            this.file_name = name;

            this.shaderProgram.set_texture('audio', name, this.audio_ready);
          },
          onTrimLeft(diff){
            this.trimBefore += diff;
          },
          set_file_name(new_name){
            this.file_name = new_name;
          },
          audio_ready(audio){
            // "this" points to <audio> element
            if(!this.durationSent){
              this.onDuration(audio.duration);
              this.durationSent = true;
            }

            // Don't resize audio after initial resize
            this.durationInitialized = true;
          }
        },
        watch: {
          trimBefore(){
            this.effect.trimBefore = this.trimBefore;
          },
          muted(m){
            this.effect.muted = m;
          },
          effect(){
            this.effect.muted = this.muted;
          },
          file_name(){
            this.shaderProgram.set_texture('audio', this.file_name, this.audio_ready);
          }
        },
        mounted(){
          this.file_store = window.API.call("shader_player.get_file_store");
        },
        beforeDestroy(){
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
