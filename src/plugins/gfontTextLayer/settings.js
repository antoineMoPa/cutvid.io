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
  <input v-model="text.text" name="text-input" type="text" style="width:calc(100% - 30px);">
  <label class="span-table"><span>Font size</span><span>Offset top</span><span>Offset left</span></label>
  <input v-model.number="text.size">
  <input v-model.number="text.offsetTop" size="4">
  <input v-model.number="text.offsetLeft" size="4">
  <br>
  <label><span>Color</span></label>
  <input v-model="text.color" type="color">
  <h4>Font selection</h4>
  <span class="info">Current font: {{font}}</span><br><br>
  <div v-if="showFonts">
    <button v-on:click="showFonts = false">Hide Fonts</button>
  </div>
  <div v-if="!showFonts">
    <button v-on:click="showFonts = true">Browse Fonts</button>
  </div>
  <div class="gfont-scrollbox" v-if="showFonts">
    <div v-for="info in fonts">
      <span class="raw-fontname">{{info.font}}</span><br>
      <button v-bind:class="(info.font == font ? 'current-font':'') + ' gfont-button'"
              v-on:click="changeFont(info.font)">
        <img v-bind:data-fontName="info.font"
             v-bind:src="'/app/plugins/gfontTextLayer/font_previews/'+info.font+'.png'"
             v-bind:alt="info.font"/>
      </button><br>
    </div>
  </div>
  <textBox
           v-if="active"
           v-on:down="focusText"
           v-bind:text="text"
           v-bind:player="player"
           v-on:move="moveText"
           v-on:align="align"
           v-bind:active="active"/>
</div>`,
        data: function(){
          return {
            serializeExclude: ["fonts", "showFonts"],
            fonts: [],
            font: "Allerta Stencil",
            active: false,
            showFonts: false,
            uniqueID: (Math.random() + "").substr(0,10),
            text:{
              text: "Your text!",
              color: "#ffffff",
              size: 200,
              offsetTop: 400,
              offsetLeft: 50,
              width: 1800,
              align: "center"
            },
          };
        },
        props: ["player", "shaderProgram"],
        methods: {
          align(val){
            this.text.align = val;
          },
          focusText(){
            let input = this.$el.querySelectorAll("[name=text-input]")[0];
            input.focus();
          },
          moveText(x, y, w, h){
            if(x != null){
              this.text.offsetLeft = x;
            }
            if(y != null){
              this.text.offsetTop = y;
            }
            if(h != null){
              this.text.size = h;
            }
            if(w != null){
              this.text.width = w;
            }
          },
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
            let scaleFactor = this.player.width / 1920.0;

            ctx.textAlign = this.text.align;

            // Set font size & style
            var tsize = this.text.size * scaleFactor;

            ctx.fillStyle = this.text.color;
            ctx.textBaseline = "middle";
            ctx.font = tsize + "px " + this.font;

            let l = this.text.offsetLeft;
            let t = this.text.offsetTop;

            // Translate, rotate and render
            ctx.save();
            // Adapt width if too small

            let measure = ctx.measureText(this.text.text);
            this.text.width = Math.max(measure.width, this.text.width);

            let x = 0;
            let y = (t + this.text.size * 0.6) * scaleFactor;

            if(this.text.align == "center"){
              x  = (l + this.text.width/2) * scaleFactor;
            } else if (this.text.align == "left"){
              x  = l * scaleFactor;
            } else {
              x = (l + this.text.width) * scaleFactor;
            }
            ctx.fillText(this.text.text, x, y);
            ctx.restore();

            this.shaderProgram.set_texture(
              "texture0",
              textCanvas.toDataURL(),
              function(){}
            );
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
          },
          text: {
            handler: function () {
              this.updateTexts();
            },
            deep: true
          },
          player(){
            this.updateTexts();
            this.player.add_on_resize_listener(this.updateTexts.bind(this), this.uniqueID);
          },
          textCanvas(){
            this.updateTexts();
          },
          backgroundColor(){
            this.updateTexts();
          }
        },
        mounted(){
          let app = this;
          window.c = this;
          let img = document.createElement("img");
          let imgload = new Promise(function(resolve, reject) {
            img.onload = function(){
              resolve(null);
            };
          });
          this.img = img;

          if(this.player != null){
            this.player.add_on_resize_listener(this.updateTexts.bind(this), this.uniqueID);
          }

          img.src = "/app/plugins/gfontTextLayer/fonts.png";

          Promise.all([
            imgload,
            fetch("/app/plugins/gfontTextLayer/fonts.json")
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
        },
        beforeDestroy(){
          this.player.delete_on_resize_listener(this.uniqueID);
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
