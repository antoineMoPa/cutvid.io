/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "fashionista";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Fashionista",
      ui: {
        template: `
<div>
  <!--
  <label>Glitch Factor</label>
  <input v-model.number="uniforms.glitchFactor.value" min="0.0" max="2.0" step="0.1" type="number">
  -->
  <label>Background Color</label>
  <input v-model="bgcolor" type="color">
  <label>Foreground Color</label>
  <input v-model="fgcolor" type="color">
  <label>Choose mask</label>
  <div class="fashionista-scrollbox">
    <div class="fashionista-image-container"
         v-for="imageIndex in images"
         >
      <img width="300"
           v-on:click="image = imageIndex"
           class="fashionista-image"
           v-bind:src="'/app/plugins/fashionista/backgrounds/'+imageIndex+'.svg'"/>
    </div>
  </div>
</div>`,
        data: function(){
          function range(a,b){
            let arr = [];

            for(; a < b; a++){
              arr.push(a);
            }

            return arr;
          };

          return {
            images: range(1,20),
            image: null,
            bgcolor: "#000000",
            fgcolor: "#ffffff",
            uniforms: {
              glitchFactor: {
                type: "f",
                len: 1,
                value: 0.5,
              },
              bgr: {
                type: "f",
                len: 1,
                value: 0.0,
              },
              bgg: {
                type: "f",
                len: 1,
                value: 0.0,
              },
              bgb: {
                type: "f",
                len: 1,
                value: 0.0,
              },
              fgr: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              fgg: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              fgb: {
                type: "f",
                len: 1,
                value: 1.0,
              },
            }
          };
        },
        props: ["player", "effect", "shaderProgram"],
        methods: {
        },
        watch: {
          image(){
            if(this.image == null){
              return;
            }
            let url = '/app/plugins/fashionista/backgrounds/'+this.image+'.svg';
            this.shaderProgram.set_texture("mask", url, function(){}, {
              force_width: this.player.width,
              force_height: this.player.height
            });
          },
          "bgcolor": {
            handler(){
              this.uniforms.bgr.value = parseInt(this.bgcolor.substring(1,3), 16)/255;
              this.uniforms.bgg.value = parseInt(this.bgcolor.substring(3,5), 16)/255;
              this.uniforms.bgb.value = parseInt(this.bgcolor.substring(5,7), 16)/255;
            },
            deep: true
          },
          "fgcolor": {
            handler(){
              this.uniforms.fgr.value = parseInt(this.fgcolor.substring(1,3), 16)/255;
              this.uniforms.fgg.value = parseInt(this.fgcolor.substring(3,5), 16)/255;
              this.uniforms.fgb.value = parseInt(this.fgcolor.substring(5,7), 16)/255;
            },
            deep: true
          }

        },
        mounted(){
          document.fonts.ready.then(this.updateTexts);
        }
      }
    }
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
