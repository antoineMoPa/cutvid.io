Vue.component('player', {
  template:
  `<div class="player">
    <div v-bind:class="'settings-panel rendering-info-panel ' +
                       (player == null || !player.rendering?
                       'settings-panel-hidden':
                       '')">
      <div v-if="player != null && player.renderMode == 'HQ'">
        <h3>Rendering in progress</h3>
        <h4>Magic in progress</h4>
        <p>
          Feel free to read a blog post or order a coffee while we work!
        </p>
        <p>
          We are rendering your video, this process takes some time.
        </p>
        <h4>Status</h4>
        <p class="render-status">
          Beginning render
        </p>
        <h4>Don't close your tab</h4>
        <p>
          Don't close or reload this tab, as you will lose your progress.
        </p>
        <h4>When it is done</h4>
        <p>
          When rendering is over, you will be presented instructions on how to
          purchase or download your video.
        </p>
        <h4>Cancelling</h4>
        <p>
          You can cancel this render and keep working with the big red button in
          the sequencer.
        </p>
        <h4>Pricing</h4>
        <p>
          One time video renders cost US$ 4.50
        </p>
      </div>
      <div v-else>
        <h3>Rendering in progress</h3>
        <h4>Why buy HQ rendering?</h4>
        <p>1. Support the development of Lattefx.<br>
           2. Careful video + sound timing.<br>
           3. High quality frame by frame render.
        </p>
        <h4>How does HQ rendering work?</h4>
        <p>HQ rendering carefully extracts your video frames on our server. The frames are then sent back to your browser, which applies effects. Everything is then put together on our server.</p>
        <h4>How does LQ rendering work?</h4>
        <p>LQ (low-quality, free) rendering happens entirely in your browser, which is quick but incurs some limitations. (dropped frames, poor quality)</p>
      </div>
    </div>
    <div v-bind:class="'settings-panel ' +
                       (player != null && player.rendering?
                       'settings-panel-hidden':
                       '')">
      <panel-selector ref="panel-selector"
        v-bind:panelNames="['Effects', 'Video']"
        v-on:switch="switch_panel"/>

      <div class="switchable-panel all-sequences-container">
        <!-- sequencer puts stuff here -->
      </div>
      <div class="switchable-panel">
        <h4>Dimensions & fps</h4>
        <br>
        <label>width x height (pixels):</label>
        <input v-model.number="width" type="number"> x
        <input v-model.number="height" type="number">
        <label>Presets</label>
        <a class="preset" v-on:click="set_dimensions(1280,720,30)">HD 720p</a>
        <a class="preset" v-on:click="set_dimensions(540,540,10)">Square 540</a>
        <a class="preset" v-on:click="set_dimensions(600,315,30)">Instagram Ad</a>
        <a class="preset" v-on:click="set_dimensions(864,1080,30)">Instagram Video</a>
        <label>HQ presets (got a good GPU?)</label>
        <a class="preset" v-on:click="set_dimensions(1920,1080,30)">Full HD 1080p</a>
        <a class="preset" v-on:click="set_dimensions(3840,2160,30)">UHD</a>
        <a class="preset" v-on:click="set_dimensions(4096,2160,30)">Movie 4K</a>

        <label>FPS (frames per seconds)</label>
        <input v-model.number="fps" type="number">
        <h4>File & save</h4>
        <p>Download a working copy to modify your video later.</p>
        <label>
          <button v-on:click="onSaveLatteFxFile">
            Download
          </button>
        </label>
        <label>
          Load a .lattefx file<br>
          <input type="file" v-on:change="onLoadLatteFxFile"/>
        </label>
        <br><br>
      </div>
    </div>
    <div id="main-player">
      <div class="canvas-container"/>
      <div class="player-overlay"/>
      <sequencer
        ref="sequencer"
        v-on:playLooping="playLooping"
        v-bind:player="player"
     />
    </div>
    <buy-video ref="buyVideo" v-bind:settings="settings"/>
    <download-lq ref="downloadLQ"
                 v-on:renderHQ="makeHQ"/>
    <ui ref="ui"
        v-on:playAll="playAll"
        v-on:renderHQ="makeHQ"
        v-on:renderLQ="makeLQ"
        v-on:cancelRender="onCancelRender"
        v-bind:player="player"/>
  </div>`,
  data(){
    return {
      player: null,
      width: 1920,
      height: 1080,
      aspect: 1920.0/1080,
      user_token: null,
      expert_mode: true,
      fps: 30,
      watermark: ""
    };
  },
  props: ["settings"],
  methods: {
    set_dimensions(w, h, fps){
      this.width = w;
      this.height = h;
      this.fps = fps;
      this.update_dimensions();
    },
    playAll(){
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
      let y_spacing = 100 + 150 + 20; // 100: bottom ui, 250: sequencer, margin

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
      let displayed_h = available_size / app.aspect;
      let canvas_container = document.querySelectorAll("#main-player .canvas-container")[0];
      let player_overlay = document.querySelectorAll("#main-player .player-overlay")[0]
      let sequencer = document.querySelectorAll("#main-player .sequencer")[0];

      sequencer.style.width =
        (x_available_space - x_spacing) + "px";
      sequencer.style.top =
        (y_available_space - y_spacing + 35) + "px";

      sequencer.style.left = (x_spacing - 20) + "px";

      player_overlay.style.width =
        app.player.canvas.style.maxWidth =
        displayed_w + "px";
      player_overlay.style.height =
        app.player.canvas.style.maxHeight =
          displayed_h + "px";

      player_overlay.style.position =
        canvas_container.style.position = "absolute";

      player_overlay.style.top =
        canvas_container.style.top = 0 + "px";

      let x_align_center = parseInt((x_available_space - x_spacing - available_size) / 2);
      player_overlay.style.left =
        canvas_container.style.left =
        x_spacing - 20 + x_align_center + "px";
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
    render(mode, doneCallback) {
      let totalFrames = this.fps * this.player.get_total_duration();
      this.player.rendering = true;
      this.player.renderMode = mode;
      this.player.pause();
      this.player.render(function(data){
        doneCallback(data[0]);
      });
    },
    makeLQ(){
      // Web render with low quality
      this.playAll();

      if (this.player.rendering) {
        return;
      }

      this.player.rendering = true;

      this.$refs.ui.set_progress(0.0);

      this.render("LQ", function(blob){
        this.$refs.downloadLQ.show(blob);
        fetch("/stats/lattefx_app_lq_render_done/");
      }.bind(this));

      fetch("/stats/lattefx_app_lq_initiate_download/");
    },
    makeHQ(){
      // Hybrid render High Quality
      if (this.player.rendering) {
        return;
      }

      this.player.rendering = true;

      this.$refs.ui.set_progress(0.0);

      this.render("HQ", function(vidid){
        this.$refs.buyVideo.show(vidid);
        fetch("/stats/lattefx_app_render_done/");
      }.bind(this));

      fetch("/stats/lattefx_app_initiate_buy/");
    },
    onCancelRender(){
      this.player.cancel_render();
    },
    onSaveLatteFxFile(){
      let data = JSON.stringify(this.serialize());
      let a = document.createElement("a");
      var blob = new Blob([data], {type : 'text/json'});
      var url = URL.createObjectURL(blob);
      a.href = url;
      a.download = "videodata.lattefx";
      document.body.appendChild(a);
      a.click();
    },
    onLoadLatteFxFile(e){
      let app = this;
      let file = e.target.files[0];
      var reader = new FileReader();
      reader.addEventListener("loadend", function() {
        app.unserialize(JSON.parse(reader.result));
      });
      reader.readAsText(file);
    },
    loadLatteFxFile(url){
      let app = this;
      fetch(url).then((result) => {
        result.json().then((obj) => {
          app.unserialize(obj);
        })
      })
    },
    serialize(){
      let data = {};
      data.width = this.width;
      data.height = this.height;
      data.fps = this.fps;
      data.scenes = this.$refs['sequencer'].serialize();

      return data;
    },
    unserialize(data){
      let app = this;

      this.width = data.width;
      this.height = data.height;
      this.fps = data.fps;

      this.$refs['sequencer'].unserialize(data.scenes, true);
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

    app.player = new ShaderPlayerWebGL();
    app.player.on_progress = this.on_player_progress;
    app.player.set_width(app.width);
    app.player.set_height(app.height);
    app.on_resize();
    let container = document.querySelectorAll("#main-player .canvas-container")[0];
    app.player.set_container(container);
    this.switch_panel(0);
    this.$refs['panel-selector'].switch_to(0);
    this.pause();

    this.loadLatteFxFile("default.lattefx");
  },
});
