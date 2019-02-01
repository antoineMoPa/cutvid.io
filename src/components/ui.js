Vue.component('ui', {
  template: `<div class="ui">
    <div class="play-button" v-on:click="toggle_play">
      <img v-if="!playing" 
           class="play-icon"
           src="icons/feather/play.svg"/>
      <img v-else
           class="pause-icon" 
           src="icons/feather/pause.svg"/>
    </div>
  </div>`,
  data(){
	return {
	  playing: true
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
	}
  }
})
