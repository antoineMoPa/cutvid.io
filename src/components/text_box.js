Vue.component('textBox', {
  template: `
<div>
  <div class="text-box"
    v-bind:style="style"
    v-if="active"
    v-on:mousedown.self="textBoxDown"
    v-on:click="sendFocus"
    >
    <div class="align-buttons">
      <div class="align-button"
           v-on:click="alignLeft">
        <img src="/app/icons/feather/align-left.svg">
      </div>
      <div class="align-button"
           v-on:click="alignCenter">
        <img src="/app/icons/feather/align-center.svg">
      </div>
      <div class="align-button"
           v-on:click="alignRight">
        <img src="/app/icons/feather/align-right.svg">
      </div>
    </div>
    <div class="handle bottom-right-handle"
         v-on:mousedown="bottomRightDown"
    />
  </div>
</div>
`,
  data(){
    return {
    };
  },
  props: ["text", "player", "active"],
  computed: {
    style(){
      let scaleFactor = this.player.width / 1920.0;
      let canvasScaleFactor = this.player.canvas.clientWidth / this.player.width;
      scaleFactor *= canvasScaleFactor;

      let top = this.text.offsetTop * scaleFactor;

      let left = this.text.offsetLeft * scaleFactor;

      let w = this.text.width * scaleFactor;
      let h = this.text.size * scaleFactor;

      return "top: "+top+"px;left:"+left+"px;"+"width:"+w+"px;height:"+h+"px;";
    }
  },
  watch: {

  },
  methods: {
	alignLeft(){
	  this.$emit("align", "left");
	},
	alignCenter(){
	  this.$emit("align", "center");
	},
	alignRight(){
	  this.$emit("align", "right");
	},
    getRealPos(e){
      let cx = e.clientX - this.player.canvas.parentNode.offsetLeft;
      let cy = e.clientY - this.player.canvas.offsetTop;

      let x = cx;
      let y = cy;
      let w = this.text.width;
      let h = this.text.size;

      return {x, y, w, h};
    },
    setBegin(e){
      let p = this.getRealPos(e);
      p.l = this.text.offsetLeft;
      p.t = this.text.offsetTop;
      this.beginP = p;
    },
    textBoxDown(e){
      this.draggingBox = true;
      this.setBegin(e);
    },
    sendFocus(){
      this.$emit("down");
    },
    bottomRightDown(e){
      this.draggingBottomRight = true;
      this.setBegin(e);
    },
    mouseUp(e){
      this.draggingBox = false;
      this.draggingTopLeft = false;
      this.draggingTopRight = false;
      this.draggingBottomLeft = false;
      this.draggingBottomRight = false;
    },
    mouseMove(e){
      e.stopPropagation();
      if(
        !this.draggingBox &&
        !this.draggingTopLeft &&
        !this.draggingTopRight &&
        !this.draggingBottomLeft &&
        !this.draggingBottomRight
      ){
        return;
      }

      let p = this.getRealPos(e);

      let w = this.beginP.w;
      let h = this.beginP.h;

      let scaleFactor = this.player.width / 1920.0;
      let canvasScaleFactor = this.player.width / this.player.canvas.clientWidth;

      if(this.draggingBox){
        this.$emit(
          "move",
          this.beginP.l + (p.x - this.beginP.x) * canvasScaleFactor,
          this.beginP.t + (p.y - this.beginP.y) * canvasScaleFactor,
          w,
          h
        );
      } else if(this.draggingTopLeft){
        this.$emit("move", x, y, w, h);
      } else if (this.draggingTopRight) {
        this.$emit("move", x, y, w, h);
      } else if (this.draggingBottomLeft) {
      } else if (this.draggingBottomRight) {
          w = w + (p.x - this.beginP.x) * canvasScaleFactor;
        h = h + (p.y - this.beginP.y) * canvasScaleFactor;
        this.$emit("move", null, null, w, h);
      }
    }
  },
  mounted(){
    let container = document.querySelectorAll(".player-overlay")[0];
    this.container = container;
    container.appendChild(this.$el);
    this.container.addEventListener('mousemove', this.mouseMove);
    window.addEventListener('mouseup', this.mouseUp);
  },
  beforeDestroy(){
    this.container.removeEventListener('mousemove', this.mouseMove);
    window.removeEventListener('mouseup', this.mouseUp);
  }
});
