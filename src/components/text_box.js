Vue.component('textBox', {
  template: `
<div class="text-box" v-bind:style="style">
  <div class="handle top-left-handle"
       v-on:mousedown="topLeftDown"
       v-on:mouseup="topLeftUp"
       
  />
  <div class="handle top-right-handle"
       v-on:mousedown="topRightDown"
       v-on:mouseup="topRightUp"
       
  />
  <div class="handle bottom-left-handle"
       v-on:mousedown="bottomLeftDown"
       v-on:mouseup="bottomLeftUp"
       
  />
  <div class="handle bottom-right-handle"
       v-on:mousedown="bottomRightDown"
       v-on:mouseup="bottomRightUp"
       
  />
</div>
`,
  data(){
	return {
	};
  },
  props: ["text", "player"],
  computed: {
	style(){
	  let scaleFactor = this.player.width / 1920.0;
	  let canvasScaleFactor = this.player.canvas.clientWidth / this.player.width;
	  scaleFactor *= canvasScaleFactor;
	  
	  let top = canvasScaleFactor * this.player.height/2 + 
		  this.text.offsetTop * scaleFactor;
	  
	  let left = canvasScaleFactor * this.player.width/2 + 
		  this.text.offsetLeft * scaleFactor;
	  
	  return "top: "+top+"px;left:"+left+"px;"
	}
  },
  watch: {
	
  },
  methods: {
	topLeftDown(e){
	  this.draggingTopLeft = true;
	},
	topLeftUp(e){
	  this.draggingTopLeft = false;
	},
	topRightDown(e){
	  this.draggingTopRight = true;
	},
	topRightUp(e){
	  this.draggingTopRight = false;
	},	bottomLeftDown(e){
	  this.draggingBottomLeft = false;
	},
	bottomLeftUp(e){
	  this.draggingBottomLeft = false;
	},
	bottomRightDown(e){
	  this.draggingBottomRight = false;
	},
	bottomRightUp(e){
	  this.draggingBottomRight = false;
	},
	mouseMove(e){
	  let cx = e.clientX;
	  let cy = e.clientY;
	  let scaleFactor = this.player.width / 1920.0;
	  let canvasScaleFactor = this.player.canvas.clientWidth / this.player.width;
	  
	  let x = cx * canvasScaleFactor;
	  let y = cy * canvasScaleFactor;
	  
	  if(this.draggingTopLeft){
		this.$emit("move", x, y);
	  } else if (this.draggingTopRight) {
	  
	  } else if (this.draggingBottomLeft) {
	  
	  } else if (this.draggingBottomRight) {
	  
	  }
	}
  },
  mounted(){
	let container = document.querySelectorAll(".player-overlay")[0];
	this.container = container;
	container.appendChild(this.$el);
	this.container.addEventListener('mousemove', this.mouseMove);
  },
  beforeDestroy(){
	this.container.removeEventListener('mousemove', this.mouseMove);
  }
});
