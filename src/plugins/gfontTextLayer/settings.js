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
  <div v-for="(text, index) in texts" v-bind:key="text+index">
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
    <span class="info">Current font: {{text.font}}</span><br><br>
    <div v-if="text.showFonts">
      <button v-on:click="showFonts = false">Hide Fonts</button>
    </div>
    <div v-if="!text.showFonts">
      <button v-on:click="text.showFonts = true">Browse Fonts</button>
    </div>
    <div class="gfont-scrollbox" v-if="text.showFonts">
      <div v-for="info in fonts">
        <span class="raw-fontname">{{info.font}}</span><br>
        <button v-bind:class="(info.font == text.font ? 'current-font':'') + ' gfont-button'"
                v-on:click="changeFont(index, info.font)">
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
           v-bind:index="index"
           v-bind:player="player"
           v-on:move="moveText"
           v-on:remove="remove"
           v-on:align="align"
           v-bind:active="active"/>
  </div>
  <div class="text-right">
    <button class="button" v-on:click="addBox">
      <img src="icons/feather/file-plus.svg" width="20"/>
      Add text box
    </button>
  </div>
</div>`,
        data: function(){
          return {
            serializeExclude: ["fonts", "showFonts"],
            fonts: [],
            active: false,
            uniqueID: (Math.random() + "").substr(0,10),
            texts: []
          };
        },
        props: ["player", "shaderProgram"],
        methods: {
          addBox(){
            this.texts.push({
              text: "Your text " + (this.texts.length+1) + "!",
              color: "#ffffff",
              font: "Allerta Stencil",
              size: 200,
              offsetTop: 400,
              offsetLeft: 50,
              width: 1800,
              align: "center",
              showFonts: false
            });
            this.newFont();
          },
          remove(index){
            this.texts.splice(index, 1);
          },
          align(index, val){
            this.texts[index].align = val;
          },
          focusText(index){
            let input = this.$el.querySelectorAll("[name=text-input]")[0];
            input.focus();
          },
          moveText(index, x, y, w, h){
            if(x != null){
              this.texts[index].offsetLeft = x;
            }
            if(y != null){
              this.texts[index].offsetTop = y;
            }
            if(h != null){
              this.texts[index].size = h;
            }
            if(w != null){
              this.texts[index].width = w;
            }
            this.updateTexts();
          },
          changeFont(index, fontName){
            this.texts[index].font = fontName;
            this.newFont();
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


            for(let i = 0; i < this.texts.length; i++){
              let t = this.texts[i];

              ctx.textAlign = t.align;

              // Set font size & style
              var tsize = t.size * scaleFactor;

              ctx.fillStyle = t.color;
              ctx.textBaseline = "middle";
              ctx.font = tsize + "px " + t.font;

              let left = t.offsetLeft;
              let top = t.offsetTop;

              // Translate, rotate and render
              ctx.save();
              // Adapt width if too small

              let measure = ctx.measureText(t.text);
              t.width = Math.max(measure.width, t.width);

              let x = 0;
              let y = (top + t.size * 0.6) * scaleFactor;

              if(t.align == "center"){
                x  = (left + t.width/2) * scaleFactor;
              } else if (t.align == "left"){
                x  = left * scaleFactor;
              } else {
                x = (left + t.width) * scaleFactor;
              }
              ctx.fillText(t.text, x, y);
              ctx.restore();
            }

            this.shaderProgram.set_texture(
              "texture0",
              textCanvas.toDataURL(),
              function(){}
            );
          },
          newFont(){
            let app = this;

            for(let i = 0; i < this.texts.length; i++){
              let promise = utils.load_gfont(
                this.texts[i].font,
                this.texts[i].size,
                this.texts[i].text
              );
              promise.then(function(){
                app.updateTexts();
              });
            }
          }
        },
        watch: {
          texts: {
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
