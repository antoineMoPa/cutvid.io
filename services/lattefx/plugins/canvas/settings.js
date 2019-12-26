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
  <div class="canvas-plugin-ui">
    <div class="canvas-plugin-buttons">
      <button class="canvas-plugin-button" v-on:click="add_text">
        <img src="icons/feather/edit-2.svg"
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
      <button class="canvas-plugin-button delete-button" v-on:click="delete_selection">
        <img src="icons/feather/trash.svg"
           class="feather-icon " width="20">
      </button>
    </div>
    <canvas class="canvas-plugin-canvas"></canvas>
  </div>
</div>`,
        data: function(){
          return {
            serializeExclude: ["canvas", "canvas_el", "data"],
            image: null,
            imageName: "",
            backgroundColor: "#000000",
            at_mount_load: "",
            player: null,
            effect: null,
            shaderProgram: null
          };
        },
        methods: {
          update_canvas(){
            this.shaderProgram.set_texture(
              'image',
              this.canvas.toCanvasElement(4), function(){});
          },
          serialize(){
            return this.canvas.toJSON();
          },
          async unserialize(data){
            await utils.load_script("./plugins/canvas/fabric.min.js");
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
            this.update_canvas();
          },
          add_text(){
            canvas = this.canvas;
            let text = new fabric.IText('New text', { left: 100, top: 100 });
            canvas.add(text);
            canvas.renderAll();
          },
          add_rect(){
            canvas = this.canvas;

            let rect = new fabric.Rect({
              top: 50, left: 50,
              width: 200, height: 100,
              fill: '#333', opacity: 0.7
            });

            canvas.add(rect);
            canvas.renderAll();
          },
          add_circle(){
            canvas = this.canvas;

            let circle = new fabric.Circle({
              top: 50, left: 50,
              radius: 20,
              fill: '#333'
            });
            console.log(circle);
            canvas.add(circle);
            canvas.renderAll();
          },
          delete_selection(){
            let selection = this.canvas.getActiveObject();

            if(selection.toGroup != undefined){
              selection = selection.toGroup();
            }

            this.canvas.remove(selection);
            this.canvas.renderAll();
            this.update_canvas();
          },
          listen_modified(){
            this.canvas.on("object:modified", this.update_canvas);
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
            this.canvas = canvas;

            canvas.renderAll();
          }
        },
        watch: {
        },
        async mounted(){
          await utils.load_script("./plugins/canvas/fabric.min.js");

          this.init_canvas();
          this.player.add_on_resize_listener(this.on_resize);
          this.load_initial_data();
          this.listen_modified();
          this.listen_scaling();
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
