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
  <p v-if="texts.length == 0">
    Start by adding a text box. You can then click to edit and resize it.
  </p>
  <div v-for="(text, index) in texts" v-bind:key="text+index">
    <label>Font size</label>
    <input type="number" v-model.number="text.size" step="any">
    <br>
    <label><span>Color</span></label>
    <input v-model="text.color" type="color">
    <br/><br/>
    <button v-on:click="browse_fonts(index)">Change font</button>
    <p class="info">Current font: {{text.font}}</p>
    <textBox
           v-if="active"
           v-on:down="focusText"
           v-bind:text="text"
           v-bind:index="index"
           v-bind:player="player"
           v-on:move="moveText"
           v-on:input="changeText"
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
            active: false,
            uniqueID: (Math.random() + "").substr(0,10),
            texts: [],
            textCanvas: null,
            focussedInput: null,
            player: null,
            shaderProgram: null,
            backgroundColor: null
          };
        },
        methods: {
          browse_fonts(index){
            let app = this;
            let picker = new utils.gfont_picker();
            let container = document.createElement("div");
            document.body.appendChild(container);
            picker.$mount(container);
            picker.on_font = (fontName) => {
              app.changeFont(index, fontName);
            };
            picker.container_class = "gfont-plugin-font-picker";
          },
          addBox(){
            this.texts.push({
              text: "Your text " + (this.texts.length+1) + "!",
              color: "#ffffff",
              font: "ABeeZee",
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
            let inputs = this.$el.querySelectorAll("[name=text-input]");
            if(inputs.length >= index){
              inputs[index].focus();
            }
          },
          changeText(index, text){
            this.texts[index].text = text;
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
          onFocus(e){
            let target = e.target;
            let index = parseInt(target.getAttribute('data-index'));

            this.focussedInput = index;
            this.focusTarget = target;

            this.updateTexts();
          },
          onBlur(){
            this.focussedInput = null;
            this.updateTexts();
          },
          changeFont(index, fontName){
            this.texts[index].font = fontName;
            this.newFont();
          },
          updateTexts(){
            let textCanvas = this.canvas;
            let ctx = textCanvas.getContext("2d");
            textCanvas.width = this.player.width;
            textCanvas.height = this.player.height;

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

              /*
                 Beware infine calls to the vuejs
                 vue watcher here, because we are mutating
                 text in a watcher.
               */
              if(t.width < measure.width){
                if (measure.width < this.player.width) {
                  t.width = measure.width + 1;
                }
              }

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
              textCanvas,
              function(){}
            );
          },
          newFont(){
            let app = this;

            for(let i = 0; i < this.texts.length; i++){
              console.log("loading: " + this.texts[i].font);
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
              this.newFont();
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

          this.canvas = document.createElement("canvas");

          if(this.player != null){
            this.player.add_on_resize_listener(this.updateTexts.bind(this), this.uniqueID);
          }
          document.fonts.ready.then(this.updateTexts);
        },
        beforeDestroy(){
          this.player.delete_on_resize_listener(this.uniqueID);
          alert("destroy");

        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
