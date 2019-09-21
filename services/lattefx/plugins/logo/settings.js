/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "logo";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Logo",
      ui: {
        template: `
<div>
  <h4>Logo</h4>
  <label>Your Logo</label>
  <input type="file" accept=".png,.jpg" class="logo-file-input" v-on:change="onLogo()">
  <label>Logo Scale</label>
  <input type="number" v-model="uniforms.logoScale.value" min="0.0" max="2.0" step="0.05">
</div>`,
        data: function(){
          return {
            logo: null,
            backgroundColor: "#000000",
            uniforms: {
              logoWidth: {
                type: "f",
                len: 1,
                value: 1,
              },
              logoHeight: {
                type: "f",
                len: 1,
                value: 1,
              },
              logoScale: {
                type: "f",
                len: 1,
                value: 0.25,
              },
            }
          };
        },
        props: ["player", "effect", "shaderProgram"],
        methods: {
          findLogoDim(){
            let app = this;
            // Create headless image to find out width and height
            let img = document.createElement("img");
            img.src = app.logo;
            img.addEventListener("load", function(){
              app.uniforms.logoWidth.value = img.width;
              app.uniforms.logoHeight.value = img.height;
              console.log("found logo dim: "+img.width+"x"+img.height);
            });
          },
          loadLogo(data){
            this.shaderProgram.set_texture('logo', data);
          },
          onLogo() {
            const app = this;
            const input = this.$el.querySelectorAll('.logo-file-input')[0];

            function watch_reader(reader, name) {
              reader.addEventListener('load', () => {
                app.logo = reader.result;
                app.loadLogo(app.logo);
                app.findLogoDim();
              }, false);
            }

            try {
              const file = input.files[0];
              const reader = new FileReader();

              watch_reader(reader, file.name);

              if (file) {
                reader.readAsDataURL(file);
              }
            } catch (e) {
              // Well I guess you are using a dumb browser
              console.error(e);
            }
          },
        },
        watch: {
          logo(){
            this.findLogoDim();
            this.loadLogo(this.logo);
          }
        },
        mounted(){
          this.effect.uniforms = this.uniforms;
          this.findLogoDim();
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
