Vue.component('player', {
  template:
  `<div class="player">
    <div class="settings-panel">
      <div class="switchable-panel">
        <h3>Video Settings</h3>
        <label>width x height (pixels):</label>
        <input v-model.number="width" type="number"> x
        <input v-model.number="height" type="number">
        <label>Presets</label>
        <a class="preset" v-on:click="set_dimensions(1920,1080)">Full HD 1080p</a>
        <a class="preset" v-on:click="set_dimensions(1280,720)">HD 720p</a>
        <a class="preset" v-on:click="set_dimensions(540,540);fps=10;">Square 540</a>
        <a class="preset" v-on:click="set_dimensions(3840,2160)">UHD</a>
        <a class="preset" v-on:click="set_dimensions(4096,2160)">Movie 4K</a>
        <a class="preset" v-on:click="set_dimensions(600,315)">Instagram Ad</a>
        <a class="preset" v-on:click="set_dimensions(864,1080)">Instagram Video</a>
        <label>FPS (frames per seconds)</label>
        <input v-model.number="fps" type="number">
        <h3>Experts only</h3>
        <label>
          Export JSON (for experts only)<br>
          <button v-on:click="onExportJSON">
            Export
          </button>
        </label>
        <label>
          Import JSON (for experts only)<br>
          <input type="file" v-on:change="onImportJSON"/>
        </label>
      </div>
      <div class="switchable-panel all-scenes-container">
        <h3>Scene</h3>
        <!-- scene-selector puts stuff here -->
      </div>
      <div class="switchable-panel all-effects-container">
        <h3>Effects</h3>
        <!-- scene-selector puts stuff here -->
      </div>
      <panel-selector ref="panel-selector" v-on:switch="switch_panel"/>
    </div>
    <div id="main-player">
      <div class="canvas-container"/>
      <scene-selector
        ref="scene-selector"
        v-on:playLooping="playLooping"
        v-bind:player="player"/>
    </div>
    <buy-video ref="buyVideo"
               v-bind:settings="settings"/>
    <ui ref="ui"
        v-on:playAll="playAll"
        v-on:buy="make_buy"
        v-bind:player="player"
        v-on:gif="make_gif"/>
  </div>`,
  data(){
    return {
      player: null,
      width: 1920,
      height: 1080,
      aspect: 1920.0/1080,
      user_token: null,
      fps: 50,
      watermark: ""
    };
  },
  props: ["settings"],
  methods: {
    set_dimensions(w, h){
      this.width = w;
      this.height = h;
      this.update_dimensions();
    },
    playAll(){
      this.$refs['scene-selector'].playAll();
      this.player.animate_force_scene = null;
      this.player.play();
    },
    playLooping(){
      this.$refs['ui'].playLooping();
    },
    pause(){
      this.player.pause();
    },
    update_dimensions(){
      this.player.set_width(this.width);
      this.player.set_height(this.height);
      this.aspect = parseFloat(this.width) / parseFloat(this.height);
      this.on_resize();
    },
    on_resize(){
      let app = this;
      let left_panel_width = 315;
      let x_spacing = 60 + left_panel_width + 40; // left theme settings panel and margin
      let y_spacing = 100 + 100 + 20; // 100: bottom ui, 100: scene-selector, margin

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
      let canvas_container = document.querySelectorAll("#main-player .canvas-container")[0];
      let scene_selector = document.querySelectorAll("#main-player .scene-selector")[0];

      scene_selector.style.width = (x_available_space - x_spacing) + "px";
      scene_selector.style.top = (y_available_space - y_spacing + 35) + "px";
      scene_selector.style.left = (x_spacing - 20) + "px";
      app.player.canvas.style.maxWidth = displayed_w + "px";
      app.player.canvas.style.maxHeight = displayed_h + "px";
      canvas_container.style.position = "absolute";
      canvas_container.style.top = 0 + "px";
      let x_align_center = parseInt((x_available_space - x_spacing - available_size) / 2);
      canvas_container.style.left = x_spacing - 20 + x_align_center + "px";

    },
    on_player_progress(time, duration){
      // TODO: find less visually annoying solution
      // this.$refs.ui.set_progress(time/duration);
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
      let totalFrames = this.fps * this.player.get_total_duration();

      if (typeof (options) === 'undefined') {
        options = {
          zip: false,
          gif: false,
          sendToServer: false,
          blob: false
        };
      }
      // Renders all the frames to a png
      const app = this;

      app.player.rendering = true;
      if (app.player.pause_anim) {
        app.player.pause_anim();
      }

      const to_export = {};

      if (options.gif) {
        to_export.delay = Math.floor(1000 / app.fps);
        to_export.data = [];
      }
      if (options.sendToServer) {
        to_export.fps = app.fps;
        to_export.data = [];
      }

      const tempCanvas = document.createElement('canvas');
      const canvas = tempCanvas;

      canvas.width = app.width;
      canvas.height = app.height;

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
        if (i < totalFrames) {
          const curr = i;

          const w = pl.width;
          const h = pl.height;
          const watermark = app.watermark;
          const offset_x = 10;
          const color = '#888888';
          ctx.textAlign = 'end';
          const temp_img = document.createElement('img');

          temp_img.onload = function () {
            if (options.gif) {
              ctx.drawImage(temp_img, 0, 0);
              ctx.fillStyle = color;
              ctx.fillText(watermark, w - offset_x, h - 10);
              to_export.data.push(canvas.toDataURL());
              next();
            } else if (options.sendToServer) {
              ctx.drawImage(temp_img, 0, 0);
              ctx.fillStyle = color;
              ctx.fillText(watermark, w - offset_x, h - 10);
              canvas.toBlob(function(blob){
                to_export.data.push(blob);
                next();
              });
            } else if (options.zip) {
              const zip = window.current_zip;
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
          app.$refs.ui.set_progress((curr + 1) / totalFrames * 0.5);

          // Render
          app.player.render((curr + 1) / app.fps, (canvas) => {
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
            app.player.rendering = false;
            if (app.player.resume_anim) {
              app.player.resume_anim();
            }
          } else if (options.sendToServer) {
            // Build a form
            // Thanks to
            // shiya.io/using-fetch-to-upload-a-file/
            // For the nice quick tutorial
            let form = new FormData();
            let images = to_export.data;
            app.player.rendering = false;

            let padNumber = (number) => {
              return "00000000".substr(0, 8 - (number+' ').length) + number;
            };

            for(let i in images){
              let image = images[i];
              form.append(padNumber(i)+'.png', image);
            }

            form.append("fps", to_export.fps);
            form.append("user_token", app.user_token);
            form.append("data", JSON.stringify(app.serialize()));

            app.$refs.buyVideo.show();

            fetch(app.settings.renderer, {
              method: "POST",
              body: form,
              mode: "cors",
              credentials: "omit"
            }).then((resp) => {
              resp.text().then((data) => {
                // Now we have the video
                app.$refs.buyVideo.setVideoID(data);
                app.$refs.ui.set_progress(1.0);
                setTimeout(() => {
                  // Bring back to 0 after some time
                  app.$refs.ui.set_progress(0.0);
                }, 1000);
              });
            });
            app.$refs.ui.set_progress(0.6);

          } else if (options.zip) {
            const zip = window.current_zip;
            app.player.rendering = false;
            if (app.player.resume_anim) {
              app.player.resume_anim();
            }
            app.$refs.ui.set_progress(1.0);
            zip.generateAsync({ type: 'blob' })
              .then((blob) => {
                let a = document.createElement("a");
                var url = URL.createObjectURL(blob);
                a.href = url;
                a.download = "videopictures.zip";
                document.body.appendChild(a);
                a.click();
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

      this.playAll();

      if(this.player.rendering){
        return;
      }

      this.player.rendering = true;

      // We'll show all relevant warnings.

      if(this.width > 1000 || this.height > 1000){
        alert("Please set a lower resolution (less than 1000x1000) before exporting a gif.");
        basic_error = true;
      }
      if(this.fps > 20){
        alert("Please set a smaller fps (less than 20) before exporting a gif.");
        basic_error = true;
      }

      if(basic_error){
        this.player.rendering = false;
        return;
      }

      this.$refs.ui.set_progress(0.0);

      this.render({
        zip: false,
        gif: true
      });
    },
    make_buy(){
      this.playAll();
      window.current_zip = new JSZip()

      if(this.player.rendering){
        return;
      }

      this.player.rendering = true;

      this.$refs.ui.set_progress(0.0);

      this.render({
        sendToServer: true
      });
    },
    onExportJSON(){
      let data = JSON.stringify(this.serialize());
      let a = document.createElement("a");
      var blob = new Blob([data], {type : 'text/json'});
      var url = URL.createObjectURL(blob);
      a.href = url;
      a.download = "videodata.json";
      document.body.appendChild(a);
      a.click();
    },
    onImportJSON(e){
      let app = this;
      let file = e.target.files[0];
      var reader = new FileReader();
      reader.addEventListener("loadend", function() {
        app.unserialize(JSON.parse(reader.result));
      });
      reader.readAsText(file);
    },
    serialize(){
      let data = {};
      data.width = this.width;
      data.height = this.height;
      data.fps = this.fps;
      data.scenes = this.$refs['scene-selector'].serialize();

      return data;
    },
    unserialize(data){
	  let app = this;
	  
      this.width = data.width;
      this.height = data.height;
      this.fps = data.fps;
	  
      this.$refs['scene-selector'].unserialize(data.scenes);
    }
  },
  watch: {
    width(){
      this.update_dimensions();
    },
    height(){
      this.update_dimensions();
    },
    fps(){
    }
  },
  mounted: function(){
    let app = this;
    window.player = this;
    window.addEventListener("resize", app.on_resize);

    app.player = new ShaderPlayerWebGL2();
    app.player.on_progress = this.on_player_progress;
    app.player.set_width(app.width);
    app.player.set_height(app.height);
    app.on_resize();
    let container = document.querySelectorAll("#main-player .canvas-container")[0];
    app.player.set_container(container);

    this.switch_panel(2);
    this.$refs['panel-selector'].switch_to(2);

    this.$refs['scene-selector'].unserialize();
  },
})
