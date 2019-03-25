{
  let name = "gfontTextLayer";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Google Font Text Layer",
      ui: {
        template: `
<div>
  <h4>Text</h4>
  <label>Your text</label>
  <input v-model="text.text" type="text">
  <label class="span-table"><span>Font size</span><span>Offset top</span><span>Offset left</span><span>Color</span></label>
  <input v-model.number="text.size" step="10" type="number">
  <input v-model.number="text.offsetTop" type="number" size="4" step="25">
  <input v-model.number="text.offsetLeft" type="number" size="4" step="25">
  <input v-model="text.color" type="color">
  <map name="gfonts">
    <area v-for="info in fonts"
          v-on:click="font = info.font"
          shape="rect"
          v-bind:coords="[info.x1, info.y1, info.x2, info.y2].join(' ')"
          />
  </map>
  <img usemap="#gfonts" src="./plugins/gfontTextLayer/fonts.png">
  <h4>Background</h4>
  <label>Transparent background
    <input type="checkbox" v-model="transparentBackground">
  </label>
  <div v-if="!transparentBackground">
    <label>Background color</label>
    <input type="color" v-model="backgroundColor">
  </div>
</div>`,
        data: function(){
          return {
            fonts: [],
            font: "Open Sans",
            text:{
              text: "Hello!",
              color: "#ffffff",
              size:70,
              offsetTop: 0,
              offsetLeft: 0,
            },
            transparentBackground: true,
            backgroundColor: "#000000"
          };
        },
        props: ["player", "shaderProgram"],
        methods: {
          updateTexts(){
            let textCanvas = document.createElement("canvas");
            let ctx = textCanvas.getContext("2d");
            textCanvas.width = this.player.width;
            textCanvas.height = this.player.height;
            ctx.clearRect(0,0,textCanvas.width, textCanvas.height);

            if(!this.transparentBackground){
              ctx.fillStyle = this.backgroundColor;
              ctx.fillRect(0,0,textCanvas.width, textCanvas.height);
            }

            if(textCanvas == null || this.player == null){
              return;
            }

            let size = this.player.width;

            ctx.textAlign = "center";

            // Set font size & style
            var tsize = this.text.size;

            ctx.fillStyle = this.text.color;
            ctx.textBaseline = "middle";
            ctx.font = tsize + "px " + this.font;

            // Translate, rotate and render
            ctx.save();
            ctx.translate(this.player.width/2, this.player.height/2);
            ctx.fillText(this.text.text, this.text.offsetLeft, this.text.offsetTop);
            ctx.restore();

            this.shaderProgram.set_texture(
              "texture0",
              textCanvas.toDataURL(),
              function(){}
            );
          }
        },
        watch: {
          font(){
            utils.load_gfont(this.font);
            document.fonts.ready.then(this.updateTexts);
          },
          text: {
            handler: function () {
              this.updateTexts();
            },
            deep: true
          },
          player(){
            this.updateTexts();
          },
          textCanvas(){
            this.updateTexts();
          },
          backgroundColor(){
            this.updateTexts();
          },
          transparentBackground(){
            this.updateTexts();
          }
        },
        mounted(){
          let app = this;
          this.updateTexts();

          fetch("./plugins/gfontTextLayer/fonts.json").then(function(resp){
            resp.json()
              .then(function(data){
                app.fonts = data;
              });
          });
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
