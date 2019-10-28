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
    <div class="render-buy-info" v-if="!player.rendering">
      <p>
        Render & buy
      </p>
    </div>
    <a class="ui-button buy-button button-2"
       v-if="!player.rendering"
       v-on:click="renderLQ"
       title="Quick render">
      <img class="feather-button"
           src="icons/feather/image.svg"/>
      Espresso - US$ <span class="ui-price">2.50</span>
    </a>
    <a class="ui-button buy-button button-1"
       v-if="!player.rendering"
       v-on:click="renderHQ"
       title="High Quality render">
      <img class="feather-button"
           src="icons/feather/image.svg"/>
      Latte - US$ <span class="ui-price">4.50</span>
    </a>
    <a v-if="player.rendering"
       v-on:click="cancelRender"
       class="ui-button button-1 cancel-button">
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
