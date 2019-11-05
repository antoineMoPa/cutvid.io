/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "mask";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Mask",
      ui: {
        template: `
<div>
  <p>Masks work by applying a color to a black and white mask. The black part becomes transparent and the white part becomes the color.</p>
  <label>Your Image Mask</label>
  <input type="file" accept=".png,.jpg,.svg,.jpeg" class="image-file-input" v-on:change="onImage()">
  <label>Image Scale</label>
  <input type="number" v-model="uniforms.imageScale.value" min="0.0" max="2.0" step="0.05">
  <label>Offset Top</label>
  <input v-model.number="uniforms.offsetTop.value" type="number" size="6" step="0.05">
  <label>Offset Left</label>
  <input v-model.number="uniforms.offsetLeft.value" type="number" size="6" step="0.05">
  <label>Color</label>
  <input v-model="color" type="color">
</div>`,
        data: function(){
          return {
            image: null,
            imageName: "",
            color: "#ffffff",
            player: null,
            effect: null,
            shaderProgram: null,
            uniforms: {
              imageWidth: {
                type: "f",
                len: 1,
                value: 1,
              },
              imageHeight: {
                type: "f",
                len: 1,
                value: 1,
              },
              imageScale: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              offsetTop: {
                type: "f",
                len: 0,
                value: 0,
              },
              offsetLeft: {
                type: "f",
                len: 0,
                value: 0,
              },
              invert: {
                type: "f",
                len: 0,
                value: 0,
              },
              r: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              g: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              b: {
                type: "f",
                len: 1,
                value: 1.0,
              }
            }
          };
        },
        methods: {
          findImageDim(){
            let app = this;

            if(this.image == null){
              return;
            }

            // Create headless image to find out width and height
            let img = document.createElement("img");

            img.src = app.image;
            img.addEventListener("load", function(){
              app.uniforms.imageWidth.value = img.width;
              app.uniforms.imageHeight.value = img.height;
              console.log("found image dim: "+img.width+"x"+img.height);
            });
          },
          loadImage(data){
            if(this.imageName.indexOf(".svg") != -1){
              this.uniforms.imageWidth.value = 2048;
              this.uniforms.imageHeight.value = 2048;
              this.shaderProgram.set_texture('image', data, function(){}, {
                force_width: 2048,
                force_height: 2048
              });
            } else {
              this.shaderProgram.set_texture('image', data);
            }
          },
          onImage() {
            const app = this;
            const input = this.$el.querySelectorAll('.image-file-input')[0];

            function watch_reader(reader, name) {
              reader.addEventListener('load', () => {
                app.image = reader.result;
                app.imageName = name;


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
          image(){
            this.findImageDim();
            this.loadImage(this.image);
          },
          color: {
            handler(){
              this.uniforms.r.value = parseInt(this.color.substring(1,3), 16)/255;
              this.uniforms.g.value = parseInt(this.color.substring(3,5), 16)/255;
              this.uniforms.b.value = parseInt(this.color.substring(5,7), 16)/255;
            },
            deep: true
          }

        },
        mounted(){
          this.findImageDim();
          if(this.image == null){
            this.image = "/app/plugins/mask/default.png";
            this.loadImage(this.image);
          }
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
