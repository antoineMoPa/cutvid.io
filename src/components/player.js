Vue.component('player', {
  template: 
  `<div class="player">
    <div class="theme-settings">
      <default-theme-settings v-bind:player="player" v-bind:textCanvas="textCanvas" ref="themeSettings"/>
    </div>
    <div id="main-player">
    </div>
    <ui v-on:play="play" v-on:pause="pause"/>
  </div>`,
  data(){
    return {
      textCanvas: null,
      player: null,
      aspect: 1920.0/1080.0
    };
  },
  
  mounted: function(){
	let app = this;
    
    function on_resize(){
      let x_spacing = 40 + 200; // 300: left theme settings panel
      let y_spacing = 40 + 100; // 100: bottom ui
      
      let available_size = Math.min(
        window.innerWidth - x_spacing, 
        window.innerHeight * app.aspect - y_spacing
      );
      
      if(!app.player){
        return;
      }
      
      app.player.canvas.style.maxWidth = (available_size - x_spacing) + "px";
      app.player.canvas.style.maxHeight = (available_size * app.aspect - y_spacing) + "px";
    }
    
    window.addEventListener("resize", on_resize);

    function on_shaders_ready(vertex, fragment){
      var textCanvas = document.createElement("canvas");
      app.textCanvas = textCanvas;    
      let ctx = textCanvas.getContext("2d");
      ctx.clearRect(0,0,textCanvas.width, textCanvas.height);
      
      app.player = new ShaderPlayerWebGL2();
      
      let container = document.querySelectorAll("#main-player")[0];
      app.player.set_container(container);
      app.player.set_vertex_shader(vertex);
      app.player.set_code(fragment);
      
      app.textCanvas.width = 1920;
      app.textCanvas.height = 1080;
      app.player.set_width(1920);
      app.player.set_height(1080);
      on_resize();
      
    }
    
    Promise.all([
      fetch("themes/default/vertex.glsl"),
      fetch("themes/default/fragment.glsl")
    ]).then((values) => {
      Promise.all([
        values[0].text(),
        values[1].text()
      ]).then((values) => {
        let vertex = values[0];
        let fragment = values[1];
        on_shaders_ready(vertex, fragment);
      });
    });
  },
  methods: {
    play(){
      this.player.play();
    },
    pause(){
      this.player.pause();
    }
  }
})
