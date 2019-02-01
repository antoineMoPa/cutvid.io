Vue.component('panel-selector', {
  template: `
  <div class="panel-selector">
    <div v-for="i in count_i"
         v-on:click="switch_to(i-1)"
         v-bind:class="'panel-bullet' + ' ' + (selected == i - 1? 'selected-bullet': '')">
    </div>
  </div>`,
  data(){
    return {
      count_i: 1,
      selected: 0
    };
  },
  props: ["count"],
  mounted(){
    this.count_i = parseInt(this.count);
  },
  methods: {
    switch_to(i){
      this.selected = i;
      this.$emit("switch", i);
    }
  }
});

Vue.component('player', {
  template: 
  `<div class="player">
    <div class="theme-settings">
      <default-theme-settings class="switchable-panel" v-bind:player="player" v-bind:textCanvas="textCanvas" ref="themeSettings"/>
      <div class="switchable-panel">
        <h3>Video settings</h3>
        <label>width x height (pixels):</label>
        <input v-model.number="width" type="number"> x
        <input v-model.number="height" type="number">
        <label>Presets</label>
        <a v-on:click="set_dimensions(1920,1080)">Full HD 1080p</a>
        <a v-on:click="set_dimensions(1280,720)">HD 720p</a>
        <a v-on:click="set_dimensions(540,540)">Square 540</a>
        <a v-on:click="set_dimensions(3840,2160)">UHD</a>
        <a v-on:click="set_dimensions(4096,2160)">Movie 4K</a>
        <label>Duration (seconds)</label>
        <input v-model.number="duration" type="number">
        <label>FPS (frames per seconds)</label>
        <input v-model.number="fps" type="number">
        
      </div>
      <panel-selector v-on:switch="switch_panel" count=2 />
    </div>
    <div id="main-player">
    </div>
    <ui v-on:play="play" v-on:pause="pause" v-on:buy="make_buy" v-on:gif="make_gif"/>
  </div>`,
  data(){
    return {
      textCanvas: null,
      player: null,
      width: 1920,
      height: 1080,
      aspect: 1920.0/1080,
      duration: 3,
      fps: 50
    };
  },
  mounted: function(){
	let app = this;
    this.switch_panel(0);
        
    window.addEventListener("resize", app.on_resize);

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
      
      app.textCanvas.width = app.width;
      app.textCanvas.height = app.height;
      app.player.set_width(app.width);
      app.player.set_height(app.height);
      app.on_resize();
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
    set_dimensions(w, h){
      this.width = w;
      this.height = h;
      this.update_dimensions();
    },
    play(){
      this.player.play();
    },
    pause(){
      this.player.pause();
    },
    update_dimensions(){
      this.textCanvas.width = this.width;
      this.textCanvas.height = this.height;
      this.player.set_width(this.width);
      this.player.set_height(this.height);
      this.aspect = parseFloat(this.width) / parseFloat(this.height);
      this.$refs.themeSettings.updateTexts();
      this.on_resize();
    },
    on_resize(){
      let app = this;
      let left_panel_width = 315;
      let x_spacing = 60 + left_panel_width; // 315: left theme settings panel
      let y_spacing = 100; // 100: bottom ui
      
      let x_available_space = window.innerWidth;
      let y_available_space = window.innerHeight;
      
      let available_size = Math.min(
        x_available_space - x_spacing, 
        (y_available_space - y_spacing) * app.aspect
      );
      
      if(!app.player){
        return;
      }
      
      let displayed_w = available_size;
      let displayed_h = available_size * app.aspect;
      
      app.player.canvas.style.maxWidth = displayed_w + "px";
      app.player.canvas.style.maxHeight = displayed_h + "px";
      app.player.canvas.style.position = "absolute";
      app.player.canvas.style.top = 0 + "px";
      let x_align_center = parseInt((x_available_space - x_spacing - available_size) / 2);
      app.player.canvas.style.left = x_spacing - 20 + x_align_center + "px";
      
    },
    switch_panel(i){
      // Hide previously shown
      this.$el.querySelectorAll(".switchable-panel-shown").forEach((el) => {
        el.classList.remove("switchable-panel-shown");
      });
      
      let panel = this.$el.querySelectorAll(".switchable-panel");
      // Show current panel
      panel[i].classList.add("switchable-panel-shown");
    },
    make_gif(){
      if(this.width > 1000 || this.height > 1000){
        alert("Please set a lower resolution (less than 1000x1000) before exporting a gif.");
      }
      if(this.duration > 5){
        alert("Please set a smaller duration (less than 5 seconds) before exporting a gif.");
      }
      if(this.fps > 20){
        alert("Please set a smaller fps (less than 20) before exporting a gif.");
      }
    },
    make_buy(){
      alert("Sorry, you cannot buy videos yet.");
    }
  },
  watch: {
    width(){
      this.update_dimensions();
    },
    height(){
      this.update_dimensions();
    }
  }
})
