/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "canvas";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Canvas",
      ui: {
        template: `
<div>
  <div v-bind:class="'canvas-plugin-ui ' + (active? '': 'hidden')">
    <div class="canvas-plugin-buttons">
      <button class="canvas-plugin-button" v-on:click="add_text">
        <img src="icons/feather/type.svg"
           class="feather-icon " width="20">
      </button>
      <button class="canvas-plugin-button" v-on:click="add_rect">
        <img src="icons/feather/square.svg"
           class="feather-icon " width="20">
      </button>
      <button class="canvas-plugin-button" v-on:click="add_circle">
        <img src="icons/feather/circle.svg"
           class="feather-icon " width="20">
      </button>
      <button class="canvas-plugin-button" v-on:click="layer_up">
        <img src="icons/feather/arrow-up.svg"
           class="feather-icon " width="20">
      </button>
      <button class="canvas-plugin-button" v-on:click="layer_down">
        <img src="icons/feather/arrow-down.svg"
           class="feather-icon " width="20">
      </button>
      <button class="canvas-plugin-button delete-button" v-on:click="delete_selection">
        <img src="icons/feather/trash.svg"
           class="feather-icon " width="20">
      </button>
    </div>
    <canvas class="canvas-plugin-canvas"></canvas>
  </div>
  <p>Welcome to the canvas plugin!<br>
  When a Canvas sequence is selected, you can use the icons at the top
  of the viewing area to add text and shapes.
  </p>
  <div v-if="editing_text">
    <label>Font</label>
    <button v-on:click="browse_fonts">Change font</button>
    <label>Text color</label>
    <input v-model="color" type="color">
  </div>
  <div v-if="editing_shape">
    <label>Color</label>
    <input v-model="color" type="color">
  </div>
  <div v-if="editing_shape || editing_text">
    <label>Opacity</label>
    <input type="number" v-model.number="opacity" min="0" max="1.0" step="0.1">
  </div>
</div>`,
        data: function(){
          return {
            serializeExclude: ["canvas", "canvas_el", "selection"],
            active: false,
            image: null,
            imageName: "",
            editing_text: false,
            editing_shape: false,
            selection: null,
            color: "#000",
            text_size: 30,
            opacity: 1.0,
            at_mount_load: "",
            player: null,
            effect: null,
            shaderProgram: null
          };
        },
        methods: {
          update_canvas(){
            if(this.canvas == undefined){ return; }

            this.canvas.renderAll();
            this.shaderProgram.set_texture(
              'image',
              this.canvas.toCanvasElement(4), function(){});
          },
          serialize(){
            return this.canvas.toJSON();
          },
          initial_font_load(data){
            for(let i = 0; i < data.objects.length; i++){
              let obj = data.objects[i];
              if ("fontFamily" in obj) {
                if(obj.fontFamily == 'sans-serif'){
                  continue;
                }
                utils.load_gfont(
                  obj.fontFamily,
                  obj.fontSize,
                  obj.text
                ).then(function(){
                  this.update_canvas();
                }.bind(this));
              }
            }
            /*
            let promise = */
          },
          async unserialize(data){
            await utils.load_script("./plugins/canvas/fabric.min.js");

            this.initial_font_load(data);

            if(this.canvas != undefined){
              this.canvas.loadFromJSON(data);

              this.on_resize();
            } else {
              this.at_mount_load = data;
            }
          },
          on_resize(){
            let width = window.player.player.canvas.clientWidth;
            let height = window.player.player.canvas.clientHeight;

            this.canvas.setWidth(width)
            this.canvas.setHeight(height)

            let zoom = width/window.player.player.width;
            this.canvas.setZoom(zoom);
            this.update_canvas();
          },
          browse_fonts(){
            let app = this;
            let picker = new utils.gfont_picker();
            let container = document.createElement("div");
            document.body.appendChild(container);
            picker.$mount(container);

            picker.on_font = function(fontName) {
              let promise = utils.load_gfont(
                fontName,
                this.text_size,
                this.selection.text
              );
              promise.then(function(){
                this.selection.set("fontFamily", fontName);
                this.update_canvas();
              }.bind(this));
            }.bind(this);

            picker.container_class = "gfont-plugin-font-picker";
          },
          add_text(){
            canvas = this.canvas;
            let text = new fabric.IText('New text', {
              fontSize: 200,
              fontFamily: 'sans-serif',
              top: this.player.height/2 - 200,
              left: this.player.width/2 - 500,
            });
            canvas.add(text);
            canvas.renderAll();
          },
          add_rect(){
            canvas = this.canvas;

            let rect = new fabric.Rect({
              top: this.player.height/2,
              left: this.player.width/2,
              width: 200, height: 100,
              fill: '#333'
            });

            canvas.add(rect);
            canvas.renderAll();
          },
          add_circle(){
            canvas = this.canvas;

            let circle = new fabric.Circle({
              top: this.player.height/2,
              left: this.player.width/2,
              radius: 100,
              fill: '#333'
            });

            canvas.add(circle);
            canvas.renderAll();
          },
          delete_selection(){
            let selection = this.canvas.getActiveObject();

            if(selection.toGroup != undefined){
              selection = selection.toGroup();
            }

            this.canvas.remove(selection);
            this.update_canvas();
          },
          layer_up(){
            let selection = this.canvas.getActiveObject();

            selection.bringForward();
            this.update_canvas();
          },
          layer_down(){
            let selection = this.canvas.getActiveObject();

            selection.sendBackwards();
            this.canvas.discardActiveObject();
            this.update_canvas();
          },
          listen_modified(){
            this.canvas.on("object:modified", function(){
              this.update_canvas();
            }.bind(this));
          },
          listen_selection(){
            let listener = function(){
              let selection = this.canvas.getActiveObject();

              this.editing_shape = false;
              this.editing_text = false;

              if("text" in selection){
                this.editing_text = true;
              } else {
                this.editing_shape = true;
              }

              this.color = selection.fill;
              this.opacity = selection.opacity;

              this.selection = selection;
            }.bind(this);

            this.canvas.on("selection:created", listener);
            this.canvas.on("selection:updated", listener);
          },
          listen_scaling(){
            this.canvas.on("object:scaling", function(e) {
              // Source: https://stackoverflow.com/questions/35141349/
              let target = e.target;
              if (!target || target.type !== 'rect') {
                return;
              }
              let sX = target.scaleX;
              let sY = target.scaleY;
              target.width *= sX;
              target.height *= sY;
              target.scaleX = 1;
              target.scaleY = 1;
              target.dirty = true;
            });
          },
          load_initial_data(){
            if(this.at_mount_load != ""){
              this.unserialize(this.at_mount_load);
              this.at_mount_load = "";
            }
          },
          init_canvas(){
            // We will move canvas to the main player
            let player_overlay = document.querySelectorAll(".player-overlay")[0];

            let canvas_el = this.$el.querySelectorAll("canvas")[0];
            this.canvas_el = canvas_el;

            let ui = this.$el.querySelectorAll(".canvas-plugin-ui")[0];
            player_overlay.appendChild(ui);

            canvas_el.width = window.player.player.canvas.clientWidth;
            canvas_el.height = window.player.player.canvas.clientHeight;
            let canvas = new fabric.Canvas(canvas_el);
            canvas.preserveObjectStacking = true;
            this.canvas = canvas;

            canvas.renderAll();
          }
        },
        watch: {
          color(){
            if(this.editing_text){
              this.selection.setColor(this.color);
              this.update_canvas();
            }
            if(this.editing_shape){
              this.selection.set("fill", this.color);
              this.update_canvas();
            }
          },
          opacity(){
            this.selection.set("opacity", this.opacity);
            this.update_canvas();
          }
        },
        async mounted(){
          await utils.load_script("./plugins/canvas/fabric.min.js");

          this.init_canvas();
          this.player.add_on_resize_listener(this.on_resize);
          this.load_initial_data();
          this.listen_modified();
          this.listen_scaling();
          this.listen_selection();
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
