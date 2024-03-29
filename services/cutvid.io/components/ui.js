/**
 * UI
 *
 * The UI compomponent displays progress bars and some messages.
 * It used to contain the play/render button, but I got feedback
 * that these buttons were not visible enough.
 */


Vue.component('ui', {
  template: `<div class="ui" v-if="player != null">
    <div class="ui-progress"
         v-if="progress_width > 0">
      <div class="progress-bar"
           v-bind:style="'width:' + progress_width + 'px; max-width: '+progress_width+'px'">
      </div>
      <div class="progress-message" v-if="progress_message != ''">
        {{progress_message}}
        <button class="progress-cancel-button"
                v-if="cancel_action != null"
                v-on:click="on_cancel()">
          Cancel
        </button>
      </div>
    </div>
    <div class="ui-buttons-right">
      <p class="info" v-if="player.sequences.length == 0">
        You must add at least 1 sequence to render a video.
      </p>
    </div>
  </div>`,
  data(){
    return {
      looping: false,
      progress_width: 0,
      progress_message: "",
      progress_start_time: null,
      show_render_options: false,
      cancel_action: null
    }
  },
  props: ["player", "user_info"],
  methods: {
    expose(){
      let API = window.API;

      API.expose({
        name: "ui.begin_progress",
        doc: `Begin Progress Bar

        Sets the initial time to estimate time left.
        `,
        fn: function(progress, message, cancel_action){
          this.begin_progress();
        }.bind(this),
        no_ui: true
      });

      API.expose({
        name: "ui.set_progress",
        doc: `Update Big Progress Bar
        `,
        argsdoc: ["Progress from 0.0 to 1.0", "Message to display"],
        fn: function(progress, message, cancel_action){
          this.set_progress(progress, " " + message);
          this.cancel_action = cancel_action || null;
        }.bind(this),
        no_ui: true
      });

      API.expose({
        name: "ui.clear_progress",
        doc: `Remove Big Progress Bar
        `,
        fn: function(progress, message){
          this.set_progress(0);
          this.progress_message = "";
          this.cancel_action = null;
          progress_start_time = 0;
        }.bind(this),
        no_ui: true
      });
    },
    on_cancel(){
      this.cancel_action();
      this.set_progress(0);
      this.progress_message = "";
      this.cancel_action = null;
    },
    playLooping(){
      this.looping = true;
    },
    async render(){
      window.API.call("shader_player.render");
    },
    begin_progress(){
      this.progress_start_time = new Date().getTime();
    },
    set_progress(progress_ratio, message){
      // TODO: Multiple progress bars, independently cancellable
      this.progress_width = progress_ratio * window.innerWidth;

      let time_message = "";

      if(this.progress_start_time != null){
        let time = new Date().getTime() - this.progress_start_time;
        let seconds = parseInt(time/1000);
        let progress_speed = (progress_ratio / time);
        let seconds_left_estimate = parseInt((1.0 - progress_ratio) / progress_speed / 1000);

        if(seconds > 3){
          time_message += ` | Started ${seconds} seconds ago.`;
        }
        if(seconds > 10 && progress_ratio < 0.99){
          if(seconds > 30 && seconds_left_estimate < 3){
            time_message += " Only a few seconds left!";
          } else {
            time_message += ` Approx. ${seconds_left_estimate} seconds to go.`;
          }
        }
      }

      this.progress_message = " " + message + time_message;

    }
  },
  watch:{
    show_render_options(){
      setTimeout(function(){
        this.show_render_options = false;
      }.bind(this), 10000);
    }
  },
  mounted(){
    this.expose();
  }
})
