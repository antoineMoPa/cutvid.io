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
  <canvas class="canvas-plugin-canvas"></canvas>
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
            this.shaderProgram.set_texture('image', this.canvas_el, function(){});
          },
          serialize(){
            return this.canvas.toJSON();
          },
          async unserialize(data){
            await utils.load_script("./plugins/canvas/fabric.min.js");
            if(this.canvas != undefined){
              this.canvas.loadFromJSON(data);
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
          }
        },
        watch: {
        },
        async mounted(){
          await utils.load_script("./plugins/canvas/fabric.min.js");

          // We will move canvas to the main player
          let player_overlay = document.querySelectorAll(".player-overlay")[0];

          let canvas_el = this.$el.querySelectorAll("canvas")[0];
          this.canvas_el = canvas_el;
          player_overlay.appendChild(canvas_el);

          canvas_el.width = window.player.player.canvas.clientWidth;
          canvas_el.height = window.player.player.canvas.clientHeight;
          let canvas = new fabric.Canvas(canvas_el);
          this.canvas = canvas;

          canvas.renderAll();

          this.player.add_on_resize_listener(this.on_resize);

          canvas.on("object:modified", this.update_canvas);

          console.log("at mount load", this.at_mount_load);
          if(this.at_mount_load != ""){
            console.log("Loading stuff");
            this.unserialize(this.at_mount_load);
            this.at_mount_load = "";

            var text = new fabric.IText('hello world', { left: 100, top: 100 });
            canvas.add(text);

            canvas.renderAll();
          }
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
