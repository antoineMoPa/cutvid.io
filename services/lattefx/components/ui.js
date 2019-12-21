Vue.component('ui', {
  template: `<div class="ui" v-if="player != null">
    <div class="ui-progress" v-bind:style="'width:' + progress_width + 'px'">
    </div>
    <div v-if="!player.rendering && player.sequences.length > 0">
      <a class="ui-button play-button"
         v-on:click="play()"
         v-if="this.player.paused">
        <img class="play-icon feather-button"
             src="icons/feather/play.svg"/>
      </a>
      <a v-else
         class="ui-button pause-button"
         v-on:click="pause()">
        <img class="pause-icon feather-button"
             src="icons/feather/pause.svg"/>
      </a>
    </div>
    <p v-else-if="player.rendering"
       class="is-rendering">
      Please be patient while your video is rendering.
    </p>
    <div class="ui-buttons-right">
      <a class="ui-button buy-button button-1"
         v-if="!player.rendering && !show_render_options &&
               player.sequences.length > 0"
         v-on:click="show_render_options = true"
         title="High Quality render">
        <img class="feather-button"
             src="icons/feather/download.svg"/>
        Download video
      </a>
      <a class="ui-button buy-button button-2"
         v-if="!player.rendering && show_render_options"
         v-on:click="renderLQ"
         title="Quick render">
        <img class="feather-button"
             src="icons/feather/image.svg"/>
        Espresso <span class="ui-price">FREE</span>
      </a>
      <a class="ui-button buy-button button-1"
         v-if="!player.rendering && show_render_options"
         v-on:click="renderHQ"
         title="High Quality render">
        <img class="feather-button"
             src="icons/feather/image.svg"/>
        Latte - <span class="ui-price">1 render credit</span>
      </a>
      <a v-if="player.rendering"
         v-on:click="cancelRender"
         class="ui-button button-1 cancel-button">
        <img class="feather-button"
             src="icons/feather/x.svg"/>
        Cancel render
      </a>
    </div>
  </div>`,
  data(){
    return {
      looping: false,
      progress_width: 0,
      show_render_options: false
    }
  },
  props: ["player"],
  methods: {
    play(){
      this.player.play();
      fetch("/stats/lattefx_app_hit_play/");
    },
    pause(){
      this.player.pause();
    },
    playLooping(){
      this.looping = true;
    },
    renderLQ(){
      this.$emit("renderLQ");
      fetch("/stats/lattefx_app_click_render_lq/");
      this.show_render_options = false;
    },
    renderHQ(){
      let app = this;
      let ask = new utils.ask_confirm();
      let container = document.createElement("div");

      document.body.appendChild(container);
      ask.$mount(container);

      ask.message = "You are about to spend 1 render credit.";
      ask.button_yes = "Yes, let's go!";
      ask.button_no = "No, let me tweak some things.";
      ask.on_yes = () => {
        this.$emit("renderHQ");
      };
      ask.on_no = () => {
        // Do nothing
      };
      ask.container_class = "confirm-spend-credit";
    },
    cancelRender(){
      this.$emit("cancelRender");
    },
    set_progress(progress_ratio){
      this.progress_width = progress_ratio * window.innerWidth;
    }
  },
  watch:{
    show_render_options(){
      setTimeout(function(){
        this.show_render_options = false;
      }.bind(this), 10000);
    }
  }
})
