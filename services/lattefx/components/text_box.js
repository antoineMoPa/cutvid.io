Vue.component('textBox', {
  template: `
<div>
  <div v-bind:class="'text-box ' + (editing?'text-box-editable':'')"
    v-if="active"
    v-on:mousedown.self="textBoxDown"
    v-on:click="focus"
    >
    <div class="align-buttons"><div class="align-button"
           v-on:click="alignLeft">
        <img src="/app/icons/feather/align-left.svg">
      </div><div class="align-button"
           v-on:click="alignCenter">
        <img src="/app/icons/feather/align-center.svg">
      </div><div class="align-button"
           v-on:click="alignRight">
        <img src="/app/icons/feather/align-right.svg">
      </div><div class="align-button delete-button"
         v-on:click="remove">
        <img src="/app/icons/feather/x.svg">
      </div>
    </div>
    <div class="handle bottom-right-handle"
         v-on:mousedown="bottomRightDown"
    />
    <div class="editable-text" contenteditable
         v-on:mousedown.self="textBoxDown"
         v-on:input="change">
    </div>
  </div>
</div>
`,
  data(){
    return {
      uniqueID: (Math.random() + "").substr(0,10),
      editing: false
    };
  },
  props: ["text", "player", "active", "index"],
  computed: {

  },
  watch: {
    text: {
      handler: function(){
        this.buildStyle();
      },
      deep: true
    }
  },
  methods: {
    buildStyle(_left, _top, _w, _h){
      let scaleFactor = this.player.width / 1920.0;
      let canvasScaleFactor = this.player.canvas.clientWidth / this.player.width;
      scaleFactor *= canvasScaleFactor;

      _left = _left || null;
      _top = _top || null;

      let top = this.text.offsetTop * scaleFactor;
      let left = this.text.offsetLeft * scaleFactor;

      if(_top != null){
        top = _top * scaleFactor;
      }

      if(_left != null){
        left = _left * scaleFactor;
      }

      let w = (_w || this.text.width) * scaleFactor;
      let h = (_h || this.text.size) * scaleFactor;

      let box = this.$el.querySelectorAll(".text-box")[0];
      let editableText = this.$el.querySelectorAll(".editable-text")[0];

      h += 20;
      w -= 5;

      box.style.top = (-10+top)+"px";
      box.style.left = left+"px";
      box.style.width = w+"px";
      box.style.maxWidth = w+"px";
      box.style.height = h+"px"
      box.style.maxHeight = h+"px"
      if(editableText != undefined){
        editableText.style.height = h+"px";
        editableText.style.maxWidth = w+"px";
        editableText.style.lineHeight = h + "px";
        editableText.style.textAlign = this.text.align;
      }
      box.style.textAlign = this.text.align;
      box.style.fontSize = this.text.size * scaleFactor + "px";

      box.style.fontFamily = this.text.font;
    },
    remove(){
      this.$emit("remove", this.index);
      this.$destroy();
    },
    alignLeft(){
      this.$emit("align", this.index, "left");
    },
    alignCenter(){
      this.$emit("align", this.index, "center");
    },
    alignRight(){
      this.$emit("align", this.index, "right");
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
      this.$el.classList.add("dragging");
      this.draggingBox = true;
      this.setBegin(e);
    },
    focus(){
      let app = this;
      this.editing = true;
      window.addEventListener("click", function(){
        app.editing = false;
      }, {once: true});
    },
    bottomRightDown(e){
      this.draggingBottomRight = true;
      this.setBegin(e);
    },
    change(){
      let editableText = this.$el.querySelectorAll(".editable-text")[0];

      //editableText.innerText = editableText.innerText.replace("\n", "");

      this.$emit("input", this.index, editableText.innerText);
    },
    mouseUp(e){
      this.$el.classList.remove("dragging");

      if(this.beginP == undefined){
        return;
      }

      let p = this.getRealPos(e);
      let w = this.beginP.w;
      let h = this.beginP.h;
      let scaleFactor = this.player.width / 1920.0;
      let canvasScaleFactor = this.player.width / this.player.canvas.clientWidth;

      if(this.draggingBox){
        let left = this.beginP.l + (p.x - this.beginP.x) * canvasScaleFactor;
        let top = this.beginP.t + (p.y - this.beginP.y) * canvasScaleFactor;

        this.$emit(
          "move",
          this.index,
          left,
          top,
          w,
          h
        );
      } else if (this.draggingBottomRight) {
        w = w + (p.x - this.beginP.x) * canvasScaleFactor;
        h = h + (p.y - this.beginP.y) * canvasScaleFactor;

        this.$emit("move", this.index, null, null, w, h);
        this.buildStyle();
      }

      this.draggingBox = false;
      this.draggingTopLeft = false;
      this.draggingTopRight = false;
      this.draggingBottomLeft = false;
      this.draggingBottomRight = false;
    },
    mouseMove(e){
      e.stopPropagation();

      let now = new Date().getTime();
      if(this.lastMove != undefined){
        if(Math.abs(this.lastMove - now) < 60){
          return;
        }
      }

      this.lastMove = now;

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

      if(this.beginP == undefined){
        return;
      }

      let w = this.beginP.w;
      let h = this.beginP.h;

      let scaleFactor = this.player.width / 1920.0;
      let canvasScaleFactor = this.player.width / this.player.canvas.clientWidth;

      let left = this.beginP.l + (p.x - this.beginP.x) * canvasScaleFactor;
      let top = this.beginP.t + (p.y - this.beginP.y) * canvasScaleFactor;

      if(this.draggingBox){
        this.buildStyle(left, top, w, h);
      } else if (this.draggingBottomRight) {
        w = w + (p.x - this.beginP.x) * canvasScaleFactor;
        h = h + (p.y - this.beginP.y) * canvasScaleFactor;
        this.buildStyle(null, null, w, h);
      }
    },
    windowResize(){
      this.buildStyle();
    }
  },
  mounted(){
    let container = document.querySelectorAll(".player-overlay")[0];
    this.container = container;

    let editableText = this.$el.querySelectorAll(".editable-text")[0];
    editableText.innerText = this.text.text;

    if(this.player != null){
      this.player.add_on_resize_listener(this.buildStyle.bind(this), this.uniqueID);
    }

    container.appendChild(this.$el);
    this.container.addEventListener('mousemove', this.mouseMove);
    window.addEventListener('mouseup', this.mouseUp);
    window.addEventListener('resize', this.windowResize);
    this.buildStyle();
  },
  beforeDestroy(){
    let container = document.querySelectorAll(".player-overlay")[0];

    this.player.delete_on_resize_listener(this.uniqueID);

    try{
      container.removeChild(this.$el);
      this.container.removeEventListener('mousemove', this.mouseMove);
    } catch (e) {
      //
    }

    window.removeEventListener('mouseup', this.mouseUp);
    window.removeEventListener('resize', this.windowResize);
  }
});
