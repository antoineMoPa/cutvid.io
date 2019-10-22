Vue.component('ui', {
  template: `<div class="ui" v-if="player != null">
    <div class="ui-progress" v-bind:style="'width:' + progress_width + 'px'">
    </div>
    <div v-if="!player.rendering">
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
    <p v-else
       class="is-rendering">
      Please be patient while your video is rendering.
    </p>
    <a class="ui-button buy-button button-2"
       v-if="!player.rendering"
       v-on:click="renderLQ"
       title="Free, but low quality & FPS">
      Render free LQ
    </a>
    <a class="ui-button buy-button button-1"
       v-if="!player.rendering"
       v-on:click="renderHQ"
       title="You can afford it in High Quality and best FPS">
      <span class="ui-button-paypal-part">
        <img class="paypal-logo" src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png" alt="PayPal">
      </span>
      Render & Buy  US$ 4.50
    </a>
    <a v-if="player.rendering"
       v-on:click="cancelRender"
       class="ui-button button-1 cancel-button">
      <img class="pause-icon feather-button"
           src="icons/feather/x.svg"/>
      Cancel render
    </a>
  </div>`,
  data(){
    return {
      looping: false,
      progress_width: 0
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
      fetch("/stats/lattefx_app_hit_pause/");
    },
    playLooping(){
      this.looping = true;
    },
    renderLQ(){
      this.$emit("renderLQ");
      fetch("/stats/lattefx_app_click_render_lq/");
    },
    renderHQ(){
      this.$emit("renderHQ");
      fetch("/stats/lattefx_app_click_render_hq/");
    },
    cancelRender(){
      this.$emit("cancelRender");
    },
    set_progress(progress_ratio){
      this.progress_width = progress_ratio * window.innerWidth;
    }
  }
})
