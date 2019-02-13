Vue.component('panel-selector', {
  template: `
  <div class="panel-selector">
    <div v-for="(name, i) in panel_names"
         v-on:click="switch_to(i)"
         v-bind:class="'panel-bullet' + ' ' + (selected == i? 'selected-bullet': '')">
      {{ name }}
    </div>
  </div>`,
  data(){
    return {
	  panel_names: ["theme", "general"],
      selected: 0,
    };
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
      <theme-settings class="switchable-panel" v-bind:player="player" v-bind:textCanvas="textCanvas" ref="themeSettings" v-on:texture-ready="loadTextCanvas"/>
      <div class="switchable-panel">
        <h3>Video settings</h3>
        <label>width x height (pixels):</label>
        <input v-model.number="width" type="number"> x
        <input v-model.number="height" type="number">
        <label>Presets</label>
        <a class="preset" v-on:click="set_dimensions(1920,1080)">Full HD 1080p</a>
        <a class="preset" v-on:click="set_dimensions(1280,720)">HD 720p</a>
        <a class="preset" v-on:click="set_dimensions(540,540);fps=10;duration=3">Square 540</a>
        <a class="preset" v-on:click="set_dimensions(3840,2160)">UHD</a>
        <a class="preset" v-on:click="set_dimensions(4096,2160)">Movie 4K</a>
        <a class="preset" v-on:click="set_dimensions(600,315)">Instagram Ad</a>
        <a class="preset" v-on:click="set_dimensions(864,1080)">Instagram Video</a>
        <label>Duration (seconds)</label>
        <input v-model.number="duration" type="number">
        <label>FPS (frames per seconds)</label>
        <input v-model.number="fps" type="number">
      </div>
      <panel-selector v-on:switch="switch_panel" count=2 />
    </div>
    <div id="main-player">
    </div>
    <ui ref="ui"
        v-on:play="play" 
        v-on:pause="pause" 
        v-on:buy="make_buy" 
        v-on:gif="make_gif"/>
  </div>`,
  data(){
    return {
      textCanvas: null,
      player: null,
      width: 1920,
      height: 1080,
      aspect: 1920.0/1080,
      duration: 3,
      fps: 50,
      watermark: ""
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
      fetch("themes/"+theme_name+"/vertex.glsl"),
      fetch("themes/"+theme_name+"/fragment.glsl")
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
    render(options) {
      if (typeof (options) === 'undefined') {
        options = {
          zip: false,
          stack: true,
          gif: false
        };
      }

      // Renders all the frames to a png
      const app = this;

      app.player.rendering_gif = true;
      if (app.player.pause_anim) {
        app.player.pause_anim();
      }
      
      const to_export = {};

      if (options.gif) {
        to_export.delay = Math.floor(1000 / app.fps);
        to_export.data = [];
      }

      const tempCanvas = document.createElement('canvas');
      const canvas = tempCanvas;

      canvas.width = app.width;
      canvas.height = app.height;

      if (options.stack) {
        canvas.height = app.player.canvas.height * app.player.frames;
      }

      const ctx = canvas.getContext('2d');

      let i = 0;

      /*
        "Unrolled" async loop:
        for every image:
        render & load image
        onload: add to canvas
        when all are loaded: create image from canvas
      */
      function next() {
        const pl = app.player;
        if (i < pl.frames) {
          const curr = i;

          const w = pl.width;
          const h = pl.height;
          const watermark = app.watermark;
          const offset_x = 10;
          const color = '#888888';
          ctx.textAlign = 'end';
          const temp_img = document.createElement('img');

          temp_img.onload = function () {
            if (options.stack) {
              const offset = curr * pl.canvas.height;
              ctx.drawImage(temp_img, 0, offset);
              ctx.fillStyle = color;
              ctx.fillText(watermark, -offset_x, h - 10 + offset);
              next();
            } else if (options.gif) {
              ctx.drawImage(temp_img, 0, 0);
              ctx.fillStyle = color;
              ctx.fillText(watermark, w - offset_x, h - 10);
              to_export.data.push(canvas.toDataURL());
              next();
            } else if (options.zip) {
              const zip = window.shadergif_zip;
              ctx.drawImage(temp_img, 0, 0);
              ctx.fillStyle = color;
              ctx.fillText(watermark, w - offset_x, h - 10);

              // 4-Zero pad number
              let filename = 'image-';
              const numzeros = 4;
              const numlen = (`${curr}`).length;

              for (let i = 0; i < numzeros - numlen; i++) {
                filename += '0';
              }

              filename += `${curr}.png`;

              canvas.toBlob((blob) => {
                zip.file(
                  filename,
                  blob
                );
                next();
              });
            }
          };
          app.$refs.ui.set_progress((curr + 1) / pl.frames * 0.5);
          // Render
          app.player.render((curr + 1) / pl.frames, (canvas) => {
            let image_data = '';
            /*
              Shader player return a canvas,
              but iframed players (javascript)
              return a dataurl
             */
            if (typeof (canvas) != 'string') {
              image_data = canvas.toDataURL();
            } else {
              image_data = canvas;
            }

            temp_img.src = image_data;
          }, curr);
        } else {
          // Final step
          if (options.gif) {
            app.export_gif(to_export);
            app.player.rendering_gif = false;
            if (app.player.resume_anim) {
              app.player.resume_anim();
            }
          } else if (options.zip) {
            const zip = window.shadergif_zip;
            app.player.rendering_gif = false;
            if (app.player.resume_anim) {
              app.player.resume_anim();
            }
            zip.generateAsync({ type: 'blob' })
              .then((content) => {
                app.has_zip = true;
                app.zip_url = URL.createObjectURL(content);
              });
          }
        }
        i++;
      }

      next();
    },
    export_gif(to_export) {
      // Make the gif from the frames
      const app = this;

      app.$nextTick(() => {
        const gif = new GIF({
          workers: 2,
          quality: 10,
          dither: 'FloydSteinberg',
          workerScript: '/libs/gif.worker.js'
        });
        
        let data = to_export.data;

        const images = [];

        for (let i = 0; i < data.length; i++) {
          const image = new Image();
          image.src = data[i];
          image.onload = imageLoaded;
          images.push(image);
          
        }

        let number_loaded = 0;
        function imageLoaded() {
          number_loaded++;
          if (number_loaded == data.length) {
            convert();
          }
        }

        function convert() {
          for (let i = 0; i < images.length; i++) {
            gif.addFrame(images[i], { delay: to_export.delay });
          }
          
          gif.render();
          
          gif.on('progress', (p) => {
            app.$refs.ui.set_progress(0.5 + 0.5 * p);  
          });
          
          gif.on('finished', (blob) => {
            // Create image
            const size = (blob.size / 1000).toFixed(2);
            app.$refs.ui.set_progress(0.8);
            // Create base64 version
            // PERF: TODO: generate image on submit only
            const reader = new window.FileReader();
            
            reader.onloadend = function () {
              // reader.result = base64 data
              let div = document.createElement("div");
              div.classList.add("gif-popup");
              let content = "<img src='" + URL.createObjectURL(blob) + "'/>";
              content += "<p>To save gif: Right-Click image + save-as!</p>";
              div.innerHTML = content;
              
              let close_button = document.createElement("div");
              close_button.classList.add("close-button");
              close_button.innerHTML = '<img src="icons/feather-dark/x.svg" width="40"/>';
              close_button.addEventListener("click", () => {
                document.body.removeChild(div);
              });
              div.appendChild(close_button);
              
              document.body.appendChild(div);
              app.$refs.ui.set_progress(0);
            };
            reader.readAsDataURL(blob);
          });
        }
      });
    },
    make_gif(){
      let basic_error = false;
      
      if(this.player.rendering_gif){
        return;
      }
      
      // We'll show all relevant warnings.
      
      if(this.width > 1000 || this.height > 1000){
        alert("Please set a lower resolution (less than 1000x1000) before exporting a gif.");
        basic_error = true;
      }
      if(this.duration > 5){
        alert("Please set a smaller duration (less than 5 seconds) before exporting a gif.");
        basic_error = true;
      }
      if(this.fps > 20){
        alert("Please set a smaller fps (less than 20) before exporting a gif.");
        basic_error = true;
      }
      
      if(basic_error){
        return;
      }
      
      this.$refs.ui.set_progress(0.0);
      
      this.render({
        zip: false,
        stack: false,
        gif: true
      });
    },
    make_buy(){
      alert("Sorry, you cannot buy videos yet.");
    },
	loadTextCanvas(){
	  if(this.playerAlreadyHasTexture){
        this.player.delete_texture(0);
      }
	  
      this.player.add_texture(this.textCanvas.toDataURL());
      this.playerAlreadyHasTexture = true;
	}
  },
  watch: {
    width(){
      this.update_dimensions();
    },
    height(){
      this.update_dimensions();
    },
    duration(){
      this.player.frames = this.duration * this.fps;
    },
    fps(){
      this.player.frames = this.duration * this.fps;
    }
  }
})
