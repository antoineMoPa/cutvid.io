/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "gfontTextLayer";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Google Font Text Layer",
      ui: {
        template: `
<div class="gfont-plugin">
  <h4>Text</h4>
  <label>Your text</label>
  <input v-model="text.text" type="text">
  <label class="span-table"><span>Font size</span><span>Offset top</span><span>Offset left</span></label>
  <input v-model.number="text.size" step="10" type="number">
  <input v-model.number="text.offsetTop" type="number" size="4" step="25">
  <input v-model.number="text.offsetLeft" type="number" size="4" step="25">
  <br>
  <label><span>Color</span></label>
  <input v-model="text.color" type="color">
  <h4>Font selection</h4>
  <div v-if="showFonts">
    <button v-on:click="showFonts = false">Hide Fonts</button>
  </div>
  <span class="info">Current font: {{font}}</span><br><br>
  <div v-if="!showFonts">
    <button v-on:click="showFonts = true">Show Fonts</button>
  </div>
  <div class="gfont-scrollbox" v-if="showFonts">
    <div v-for="info in fonts">
      <span class="raw-fontname">{{info.font}}</span>
      <button v-bind:class="(info.font == font ? 'current-font':'') + ' gfont-button'"
              v-on:click="changeFont(info.font)">
        <img v-bind:data-fontName="info.font"
             v-bind:src="getFontPreview(info.font)"
             v-bind:alt="info.font"/>
      </button><br>
    </div>
  </div>
</div>`,
        data: function(){
          return {
            serializeExclude: ["fonts", "showFonts"],
            fonts: [],
            font: "Allerta Stencil",
            showFonts: false,
            text:{
              text: "Your text!",
              color: "#ffffff",
              size: 200,
              offsetTop: 0,
              offsetLeft: 0,
            },
          };
        },
        props: ["player", "shaderProgram"],
        methods: {
          changeFont(fontName){
            this.font = fontName;
            this.updateTexts();
          },
          updateTexts(){
            let textCanvas = document.createElement("canvas");
            let ctx = textCanvas.getContext("2d");
            textCanvas.width = this.player.width;
            textCanvas.height = this.player.height;
            ctx.clearRect(0,0,textCanvas.width, textCanvas.height);

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
          },
          getFontPreview(fontName){
            let canvas = document.createElement("canvas");
            let app = this;

            ctx = canvas.getContext("2d");
            canvas.width = 280;
            canvas.height = 48;

            let index = null;
            let fontInfo = this.fonts.map( (el, i) => {
              if (el.font == fontName) {
                index = i;
              }
            })[0];

            fontInfo = this.fonts[index];

            if(fontInfo == undefined){
              return;
            }

            let img = this.img;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img, fontInfo.x1, fontInfo.y1, 192, 48, 0.5*(280-192), 0, 192, 48);
            return canvas.toDataURL();
          },
          newFont(){
            let promise = utils.load_gfont(this.font, this.text.size, this.text.text);
            let app = this;

            promise.then(function(){
              app.updateTexts();
            });
          }
        },
        watch: {
          font(){
            this.newFont();
            this.showFonts = false;
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
        },
        mounted(){
          let app = this;

          let img = document.createElement("img");
          let imgload = new Promise(function(resolve, reject) {
            img.onload = function(){
              resolve(null);
            };
          });
          this.img = img;
          img.src = "./plugins/gfontTextLayer/fonts.png";

          Promise.all([
            imgload,
            fetch("./plugins/gfontTextLayer/fonts.json")
          ]).then(function(values){
            values[1].json()
              .then(function(data){
                app.fonts = data;
                app.$nextTick(function(){
                  // Load initial font
                  app.newFont();
                });
              });
          });
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
