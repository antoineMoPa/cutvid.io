Vue.component('ui', {
  template: `<div class="ui">
    <div class="ui-progress" v-bind:style="'width:' + progress_width + 'px'">
    </div>
    <a v-bind:class="'ui-button play-button ' + ((!looping)?'ui-disabled':'')" v-on:click="playAll">
      <img class="play-icon feather-button"
           src="icons/feather/play.svg"/>
      Play All
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
  methods: {
	playAll(){
	  this.looping = false;
	  this.$emit('playAll');
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
