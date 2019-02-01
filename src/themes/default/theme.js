/*
  
  (function shadergif_export(){
  console.log(JSON.stringify({
  vertex: app.player.vertex_shader, 
  fragment: app.player.fragment_shader
  }));
  })();

*/

Vue.component('default-theme-settings', {
  template: `
<div class="theme-settings">
  <h3>Theme settings</h3>
  <label>Text</label>
  <input v-model="text" type="text">
  <input v-model="size" type="number">
  <select v-model="font">
    <option value="Sans">Sans</option>
    <option value="Serif">Serif</option>
    <option value="Lobster">Lobster</option>
  </select>
</div>`,
  data: function(){
    return {
	  text: "test",
	  font: "Sans",
	  size: 200,
	  color: "#000000",
      playerAlreadyHasTexture: false,
	  x: 1920/2,
	  y: 1080/2
    };
  },
  props: ["player", "textCanvas"],
  methods: {
    updateTexts(){
      let texts = this.texts;
      let textCanvas = this.textCanvas;
      
      if(textCanvas == null || this.player == null){
        return;
      }
      
      let ctx = textCanvas.getContext("2d");
      
      ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      ctx.font = this.size + "px " + this.font;
      
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(this.text, this.x, this.y);
      
      if(this.playerAlreadyHasTexture){
        this.player.delete_texture(0);
      }
      
      this.player.add_texture(textCanvas.toDataURL());
      this.playerAlreadyHasTexture = true;
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
}); 

