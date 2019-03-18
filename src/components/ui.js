Vue.component('ui', {
  template: `<div class="ui" v-if="player != null">
    <div class="ui-progress" v-bind:style="'width:' + progress_width + 'px'">
    </div>
    <a v-bind:class="'ui-button play-all-button ' + ((!looping)?'ui-disabled':'')" v-on:click="playAll">
      <img class="play-icon feather-button"
           src="icons/feather/play.svg"/>
      Play All
    </a>
    <span class="looping-info" v-if="looping">currently looping scene</span>
    <span class="looping-info" v-else="looping">select a scene to loop it</span>
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
    <a class="ui-button button-2" v-on:click="gif">
      <img class="feather-button" src="icons/feather/camera.svg"/>
      Export Gif
    </a>
    <a class="ui-button buy-button button-1" v-on:click="buy">
      <img class="feather-button" src="icons/feather/download-cloud.svg"/>
      Buy Video
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
	playAll(){
	  this.looping = false;
	  this.player.setZeroTime();
	  this.$emit('playAll');
	},
	play(){
	  this.player.paused = false;
	},
	pause(){
	  this.player.paused = true;
	},
	playLooping(){
	  this.looping = true;
	},
	buy(){
	  this.$emit("buy");
	},
	gif(){
	  this.$emit("gif");
	},
	set_progress(progress_ratio){
	  this.progress_width = progress_ratio * window.innerWidth;
	}
  }
})
