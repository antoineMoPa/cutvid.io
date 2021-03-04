/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "retrowave";

  let effectSettings = function(){
	return {
	  name: name,
	  human_name: "Retrowave",
	  ui: {
		template: `
<div>
  <label>Top text</label>
  <input v-model="textTop.text" type="text">
  <label>Font size | offset</label>
  <input v-model.number="textTop.size" step="10" type="number">
  <input v-model.number="textTop.offsetTop" step="10" type="number">


  <label>Middle text</label>
  <input v-model="textMiddle.text" type="text">
  <label>Font size | offset</label>
  <input v-model.number="textMiddle.size" step="10" type="number">
  <input v-model.number="textMiddle.offsetTop"  step="10" type="number">

  <label>Bottom text</label>
  <input v-model="textBottom.text" type="text">
  <label>Font size | offset</label>
  <input v-model.number="textBottom.size" step="10" type="number">
  <input v-model.number="textBottom.offsetTop" step="10" type="number">

</div>`,
		data: function(){
		  return {
			textTop:{
			  text: "Retro",
			  size:70,
			  offsetTop: 0
			},
			textMiddle:{
			  text: "80's",
			  size:100,
			  offsetTop: 0
			},
			textBottom:{
			  text: "NIGHT",
			  size: 80,
			  offsetTop: 0
			}
		  };
		},
		props: ["player", "effects", "shaderProgram"],
		methods: {
		  updateTexts(){
			let app = this;
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

			// TOP TEXT
			// Set font size & style
			var tsize = this.textTop.size;

			ctx.fillStyle = "#ff0000";

			ctx.font = tsize +
			  "px Kaushan Script";

			// Translate, rotate and render
			ctx.save();
			ctx.translate(this.player.width/2, 1/3*this.player.height + tsize/2);
			ctx.rotate(-0.1);
			ctx.fillText(this.textTop.text, 0, this.textTop.offsetTop);
			ctx.restore();

			// MIDDLE TEXT
			ctx.fillStyle = "#00ff00";
			var tsize = this.textMiddle.size;

			ctx.font = tsize +
			  "px Monoton";

			ctx.fillText(this.textMiddle.text, this.player.width/2,  1/2 * this.player.height + tsize/2 + this.textMiddle.offsetTop);

			// BOTTOM TEXT
			ctx.fillStyle = "#0000ff";
			var tsize = this.textBottom.size;
			ctx.font = tsize +
			  "px Contrail One";

			ctx.fillText(this.textBottom.text, this.player.width/2, 2/3*this.player.height + tsize/2 + this.textBottom.offsetTop);

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
		  "textTop": {
			handler: function () {
			  this.updateTexts();
			},
			deep: true
		  },
		  "textMiddle": {
			handler: function () {
			  this.updateTexts();
			},
			deep: true
		  },
		  "textBottom": {
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
		  utils.load_gfont("Kaushan Script");
		  utils.load_gfont("Monoton");
		  utils.load_gfont("Contrail One");
		  document.fonts.ready.then(this.updateTexts);
		}
	  }
	};
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
