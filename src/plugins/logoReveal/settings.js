{
  let name = "logoReveal";
  
  let effectSettings = function(){
	return {
	  name: name,
	  human_name: "Logo Reveal",
	  ui: {
		template: `
<div>
  <h4>Logo</h4>
  <label>Your Logo</label>
  <input type="file" accept=".png,.jpg" class="logo-file-input" v-on:change="onLogo()">
  <label>Logo Scale</label>
  <input type="number" v-model="uniforms.logoScale.value" min="0.01" max="2.0" step="0.05">
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
				value: 0.5,
			  },
			}
		  };
		},
		props: ["player", "effect", "shaderProgram"],
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
			
			// Translate, rotate and render
			ctx.save();
			ctx.translate(this.player.width/2, this.player.height/2);
			ctx.restore();
            
			this.shaderProgram.set_texture(
			  "texture0",
			  textCanvas.toDataURL(),
			  function(){}
			);
		  },
		  onLogo() {
            const app = this;
            const input = this.$el.querySelectorAll('.logo-file-input')[0];
            
            function watch_reader(reader, name) {
              reader.addEventListener('load', () => {
                this.logo = reader.result;
                app.shaderProgram.set_texture('logo', reader.result);
                
                // Create headless image to find out width and height
                let img = document.createElement("img");
                img.src = reader.result;
                img.addEventListener("load", function(){
                  app.uniforms.logoWidth.value = img.width;
                  app.uniforms.logoHeight.value = img.height;
                });
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
		  player(){
			this.updateTexts();
		  },
		  textCanvas(){
			this.updateTexts();
		  },
		},
		mounted(){
		  this.updateTexts();
          this.effect.uniforms = this.uniforms;
		}
	  }
	};
  };
	
  utils.plugins[name + "-effectSettings"] = effectSettings;
}
