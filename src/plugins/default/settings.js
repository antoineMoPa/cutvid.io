{
  let name = "default";
  
  let effectSettings = function(){
	return {
	  name: name,
	  human_name: "Default",
	  ui: {
		template: `
<div>
  <input type="number" min="0.0" max="1.0" step="0.05" v-model="uniforms.strength.value">
</div>`,
		data: function(){
		  return {
			uniforms: {
			  strength: {
				type: "f",
				len: 1, /* float, not a vector: len = 1*/
				value: 0.5,
			  }
			}
		  };
		},
		props: ["player"],
		methods: {
		},
		watch: {
		},
	  }
	}
  };
  
  utils.plugins[name + "-effectSettings"] = effectSettings;
  
  let settings2D = {
	template: `
<div>
  <h4>Epic Sunset</h4>
  <label>Text</label>
  <input v-model="text.text" type="text">
  <label>Font size</label>
  <input v-model="text.size" type="number">
  <label>Top (y) offset</label>
  <input v-model.number="text.offsetTop" type="number">
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
		playerAlreadyHasTexture: false,
      };
	},
	props: ["player", "textCanvas"],
	methods: {
      updateTexts(){
		let textCanvas = this.textCanvas;

		if(textCanvas == null || this.player == null){
          return;
		}
		
		let ctx = textCanvas.getContext("2d");
		
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
		
		this.$emit("texture-ready");
      }
	},
	watch: {
      "text": {
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
      }
	}
  };
  
  utils.plugins[name + "-settings2D"] = settings2D;
}
