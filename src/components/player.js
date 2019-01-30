Vue.component('player', {
  template: 
  `<div class="player" id="main-player">
    <div class="text-editor">
      <div class="text-grabber">
      </div>
    </div>  
  </div>`,
  data(){
    return {
      texts: [{
        text: "test",
        font: "sans",
        size: 200,
        color: "#000000",
        x: 1920/2,
        y: 1080/2,
        textCanvas: null,
        player: null,
        playerAlreadyHasTexture: false
      }]
    };
  },
  methods: {
    updateTexts(){
      let texts = this.texts;
      let textCanvas = this.textCanvas;
      let ctx = textCanvas.getContext("2d");
    
      texts.map((text) => {
        ctx.font = text.size + "px " + text.font + "bold";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(text.text, text.x, text.y);
      });

      if(this.playerAlreadyHasTexture){
        this.player.delete_texture(0);
      }
      this.player.add_texture(textCanvas.toDataURL());
      //document.body.appendChild(textCanvas);
      this.playerAlreadyHasTexture = true;
    }
  },
  mounted: function(){
    let textCanvas = document.createElement("canvas");
    this.textCanvas = textCanvas;
    
    let player = new ShaderPlayerWebGL2();
    this.player = player;
    player.set_vertex_shader(default_shader.vertex);
    player.set_code(default_shader.fragment);
    
    let container = document.querySelectorAll("#main-player")[0];
    player.set_container(container);
    
    this.textCanvas.width = 1920;
    this.textCanvas.height = 1080;
    player.set_width(1920);
    player.set_height(1080);
    
    this.updateTexts();
    
  }
})
