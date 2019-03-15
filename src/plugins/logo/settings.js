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
		  player(){
			this.updateTexts();
		  },
		  textCanvas(){
			this.updateTexts();
		  },
		  logo(){
			this.findLogoDim();
			this.loadLogo(this.logo);
		  }
		},
		mounted(){
		  this.updateTexts();
          this.effect.uniforms = this.uniforms;
		  this.findLogoDim();
		}
	  }
	};
  };
	
  utils.plugins[name + "-effectSettings"] = effectSettings;
}
