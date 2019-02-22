{
  let name = "textLayer";
  
  let effectSettings = function(){
	return {
	  name: name,
	  human_name: "Simple Text Layer",
	  ui: {
		template: `
<div>
  <input v-model="text.text" type="text">
  <label>Font size | offset top | offset left </label>
  <input v-model.number="text.size" type="number">
  <input v-model.number="text.offsetTop" type="number">
  <input v-model.number="text.offsetLeft" type="number">
</div>`,
		data: function(){
		  return {
			text:{
			  text: "Simple Text",
			  size:70,
			  offsetTop: 0,
			  offsetLeft: 0
			}
		  };
		},
		props: ["player", "shaderProgram"],
		methods: {
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
			
			ctx.textAlign = "center";
			
			// Set font size & style
			var tsize = this.text.size;
			
			ctx.fillStyle = "#000000";
			
			ctx.font = tsize +
			  "px sans-serif";
			
			// Translate, rotate and render
			ctx.save();
			ctx.translate(this.player.width/2, this.player.height/2 - tsize/2);
			ctx.fillText(this.text.text, 0, this.text.offsetTop);
			ctx.restore();

			this.shaderProgram.set_texture(
			  "texture0",
			  textCanvas.toDataURL(),
			  function(){}
			);
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
		},
		mounted(){
		  this.updateTexts()
		}
	  }
	};
  };
	
  utils.plugins[name + "-effectSettings"] = effectSettings;
}
