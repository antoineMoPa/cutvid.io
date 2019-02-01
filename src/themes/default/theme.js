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
<div>
  <h3>Theme settings</h3>
  <label>Text</label>
  <input v-model="text.text" type="text">
  <input v-model="text.size" type="number">
  <select v-model="text.font">
    <option value="Sans">Sans</option>
    <option value="Serif">Serif</option>
    <option value="Lobster" style="font-family:Lobster;">Lobster</option>
  </select>
</div>`,
  data: function(){
    return {
      text:{
	    text: "test",
	    font: "Sans",
	    size: 200,
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
      
      ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      ctx.font = this.text.size + "px " + this.text.font;
      
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.fillText(this.text.text, this.player.width/2, this.player.height/2);
      
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

