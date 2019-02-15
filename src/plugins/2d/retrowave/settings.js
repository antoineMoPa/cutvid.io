{
  let name = "retrowave";
  
  let settings2D = {
	template: `
<div>
  <h4>Retrowave</h4>
  <label>Top text</label>
  <input v-model="textTop.text" type="text">
  <label>Font size | offset</label>
  <input v-model.number="textTop.size" type="number">
  <input v-model.number="textTop.offsetTop" type="number">


  <label>Middle text</label>
  <input v-model="textMiddle.text" type="text">
  <label>Font size | offset</label>
  <input v-model.number="textMiddle.size" type="number">
  <input v-model.number="textMiddle.offsetTop" type="number">

  <label>Bottom text</label>
  <input v-model="textBottom.text" type="text">
  <label>Font size | offset</label>
  <input v-model.number="textBottom.size" type="number">
  <input v-model.number="textBottom.offsetTop" type="number">


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
		
		ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
		
		let size = this.player.width;
		
		utils.load_gfont("Kaushan Script", this.updateTexts);
		utils.load_gfont("Monoton", this.updateTexts);
		utils.load_gfont("Contrail One", this.updateTexts);
		
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
		
		this.$emit("texture-ready");
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
      },
      textCanvas(){
		this.updateTexts();
      }
	}
  };
  
  utils.plugins[name + "-settings2D"] = settings2D;
}
