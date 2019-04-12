Vue.component('textBox', {
  template: `
<div>
  <div class="text-box" 
    v-bind:style="style"
    v-if="active"
    v-on:mousedown.self="textBoxDown"
    >
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
    topLeftDown(e){
      this.draggingTopLeft = true;
      this.setBegin(e);
    },
    topRightDown(e){
      this.draggingTopRight = true;
      this.setBegin(e);
    },
    bottomLeftDown(e){
      this.draggingBottomLeft = true;
      this.setBegin(e);
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
