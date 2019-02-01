Vue.component('ui', {
  template: `<div class="ui">
    <div class="ui-progress" v-bind:style="'width:' + progress_width + 'px'">
    </div>
    <div class="play-button" v-on:click="toggle_play">
      <img v-if="!playing" 
           class="play-icon"
           src="icons/feather/play.svg"/>
      <img v-else
           class="pause-icon" 
           src="icons/feather/pause.svg"/>
    </div>
    <a class="ui-button button-2" v-on:click="gif">
      <img class="feather-button" src="icons/feather-dark/image.svg"/>
      Export Gif
    </a>
    <a class="ui-button buy-button button-1" v-on:click="buy">
      <img class="feather-button" src="icons/feather/download-cloud.svg"/>
      Buy Video
    </a>
  </div>`,
  data(){
	return {
	  playing: true,
	  progress_width: 0
	}
  },
  methods: {
	toggle_play(){
	  this.playing = !this.playing;
	  if(this.playing){
		this.$emit('play');
	  } else {
		this.$emit('pause');
	  }
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
