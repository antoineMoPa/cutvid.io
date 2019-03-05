{
  let name = "epicSunset";
  
  let effectSettings = function(){
	return {
	  name: name,
	  human_name: "Epic Sunset",
	  ui: {
		template: `
<div>
  <label>Text</label>
  <input v-model="text.text" type="text">
  <label>Font size</label>
  <input v-model="text.size" step="10" type="number">
  <label>Top (y) offset</label>
  <input v-model.number="text.offsetTop" step="10" type="number">
  <label>Glitch Factor</label>
  <input v-model.number="uniforms.glitchFactor.value" min="0.0" max="2.0" step="0.1" type="number">
  <label>Font</label>
  <select v-model="text.font">
    <option value="Lobster">Lobster</option>
    <option value="Plaster">Plaster</option>
    <option value="Monoton">Monoton</option>
  </select>
</div>`,
		data: function(){
		  return {
			text:{
			  text: "test",
			  font: "Monoton",
			  size: 200,
			  offsetTop: 20,
			  color: "#000000",
			},
			uniforms: {
			  glitchFactor: {
				type: "f",
				len: 1,
				value: 0.5,
			  }
			}
		  };
		},
		props: ["player", "effect", "shaderProgram"],
		methods: {
		  updateTexts(){
			let app = this;
			let textCanvas = document.createElement("canvas");
			let ctx = textCanvas.getContext("2d");
			textCanvas.width = this.player.width;
			textCanvas.height = this.player.height;
			ctx.clearRect(0,0,textCanvas.width, textCanvas.height);
			
			utils.load_gfont("Lobster", this.updateTexts);
			utils.load_gfont("Plaster", this.updateTexts);
			utils.load_gfont("Monoton", this.updateTexts);
			
			ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
			ctx.font = this.text.size + "px " + this.text.font;
			
			ctx.fillStyle = "#000000";
			ctx.textAlign = "center";
			ctx.fillText(
			  this.text.text,
			  this.player.width/2,
			  this.player.height/2 + this.text.offsetTop
			);
			
			this.shaderProgram.set_texture(
			  "texture0",
			  textCanvas.toDataURL(),
			  function(){
				app.$emit("ready");
			  }
			);
		  }
		},
		watch: {
		  text: {
			handler: function () {
			  this.updateTexts();
			},
			deep: true
		  },
          glitchFactor: {
			handler: function () {
			  this.updateTexts();
			},
			deep: true
		  },
		  player(){
			this.updateTexts();
		  }
		},
		mounted(){
		  this.updateTexts();
          this.effect.uniforms = this.uniforms;
		}
	  }
	}
  };
  
  utils.plugins[name + "-effectSettings"] = effectSettings;
}