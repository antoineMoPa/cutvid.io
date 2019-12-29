Vue.component('player', {
  template:
  `<div class="player">
    <div v-bind:class="'settings-panel rendering-info-panel ' +
                       (player == null || !player.rendering?
                       'settings-panel-hidden':
                       '')">
      <h3>Rendering in progress</h3>
      <h4>How does Espresso/LQ rendering work?</h4>
      <p>Espresso/LQ rendering happens entirely in your browser, which is quick but incurs some limitations. (dropped frames, poor quality). But it's quick and cheap!</p>
      <h4>How does Latte/HQ rendering work?</h4>
      <p>In HQ rendering. Most of the rendering happens on our server,
        with high quality frame extraction and audio mixing.
      </p>
    </div>
    <div v-bind:class="'settings-panel ' +
                       (player != null && player.rendering?
                       'settings-panel-hidden':
                       '')">
      <panel-selector ref="panel-selector"
        v-bind:panelNames="['Effect', 'Project' /* dev only:, 'Sources' */]"
        v-on:switch="switch_panel"/>

      <div class="switchable-panel all-sequences-container">
        <!-- sequencer puts stuff here -->
      </div>
      <div class="switchable-panel">
        <h4>Dimensions & fps</h4>
        <br>
        <label>width x height (pixels):</label>
        <input v-model.number="width" min="10" max="1920" type="number"> x
        <input v-model.number="height" min="10" max="1080" type="number">
        <label>Presets</label>
        <a class="preset" v-on:click="set_dimensions(1280,720,30)">HD 720p</a>
        <a class="preset" v-on:click="set_dimensions(540,540,10)">Square 540</a>
        <a class="preset" v-on:click="set_dimensions(600,315,30)">Instagram Ad</a>
        <a class="preset" v-on:click="set_dimensions(864,1080,30)">Instagram Video</a>
        <label>HQ presets (got a good GPU?)</label>
        <a class="preset" v-on:click="set_dimensions(1920,1080,30)">Full HD 1080p</a>
        <!-- Let's wait to stress test the server before higher resolutions
          <a class="preset" v-on:click="set_dimensions(3840,2160,30)">UHD</a>
          <a class="preset" v-on:click="set_dimensions(4096,2160,30)">Movie 4K</a>
        -->
        <label>FPS (frames per seconds)</label>
        <input v-model.number="fps" type="number">
        <br><br>
        <h4>Save to Lattefx cloud</h4>
        <p>Save project in our cloud to access it from any computer.</p>
        <div class="props-auth-placeholder"/>
        <br/>
        <h4>Save a .lattefx project</h4>
        <p>Download a working copy to modify your video later.</p>
        <label>
          <button v-on:click="onSaveLatteFxFile">
            Download
          </button>
        </label>
        <br>
        <h4>Load a .lattefx project</h4>
        <label>
          Load a .lattefx file<br>
          <input type="file" v-on:change="onLoadLatteFxFile"/>
        </label>
        <br><br>
      </div>
      <div class="switchable-panel media-sources-panel">
        <h4>Media sources</h4>
        <p>Monitor this project's videos here.</p>
      </div>
    </div>
    <div id="main-player">
      <div class="canvas-container">
        <div v-if="player != null && player.sequences.length == 0">
          <a target="_blank" href="/landing/lattefx_intro_pdf_dec_2019.pdf">
            <button
              class="empty-player-button lfx-button">
              Learn how to use Lattefx [pdf]
            </button>
          </a>
        </div>
      </div>
      <div class="player-overlay"/>
      <sequencer
        ref="sequencer"
        v-on:playLooping="playLooping"
        v-on:resize="on_resize"
        v-bind:player="player"
     />
    </div>
    <buy-video-lq ref="buyVideoLQ"
                 v-bind:settings="settings"
                 v-on:renderHQ="makeHQ"/>
    <ui ref="ui"
        v-on:playAll="playAll"
        v-on:renderHQ="makeHQ"
        v-on:renderLQ="makeLQ"
        v-on:cancelRender="onCancelRender"
        v-bind:player="player"/>
    <auth ref="auth" v-bind:settings="settings"/>
    <projects ref="projects" v-bind:settings="settings"/>
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
      watermark: "",
      project_id: null,
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
      let sequencer = document.querySelectorAll("#main-player .sequencer")[0];

      let x_spacing = 60 + left_panel_width + 40; // left theme settings panel and margin
      let y_spacing = sequencer.clientHeight + 165; // 100: bottom ui

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

      this.player.call_resize_listeners();
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
        this.$refs.buyVideoLQ.show(blob);
        fetch("/stats/lattefx_app_lq_render_done/");
      }.bind(this));

      fetch("/stats/lattefx_app_lq_initiate_download/");
    },
    async makeHQ(){
      let app = this;

      let project = this.serialize();
      let user_info = await this.$refs.auth.get_user_info();

      if(user_info == null){
        utils.flag_message("You must sign in to render HQ videos!", {
          button_message: "Sign in",
          button_action: function(){
            app.$refs.auth.show_login();
          }
        });
        return;
      }

      let token = await this.$refs.auth.get_token();
      let cloud_url = this.settings.cloud;
      let data = this.serialize();
      let project_id = data.project_id;

      data = JSON.stringify(data);

      let form = new FormData();
      form.append('lattefx_file.lattefx', data);

      utils.flag_message("We are uploading your video to the render server!");

      fetch(cloud_url + "/render_video/", {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Encoding': 'multipart/form-data'
        },
        body: form
      }).then(async function(resp){
        app.saving = false;
        app.show_saved_message = true;

        let json = await resp.json();
        if(json.status != "ok"){
          utils.flag_error(json.error);
          return;
        }

        setTimeout(()=>{
          app.show_saved_message = false;
          let message =
              "Your video is processing and you'll be notified" +
              "by email once it's ready." +
              "Expect around 15 min for short videos!";

          utils.flag_message(message, {
            button_message: "Track",
            button_action: function(){
              window.open('./renders', '_blank');
            }
          });

          app.$refs.auth.update_user_info();
        }, 2000);
      });

      fetch("/stats/lattefx_app_initiate_render_hq/");
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
      fetch("/stats/lattefx_save_file/");
    },
    onLoadLatteFxFile(e){
      let app = this;
      let file = e.target.files[0];
      var reader = new FileReader();
      reader.addEventListener("loadend", function() {
        app.unserialize(JSON.parse(reader.result));
      });
      reader.readAsText(file);

      fetch("/stats/lattefx_load_file/");
    },
    loadLatteFxFile(url){
      let app = this;

      this.$refs['sequencer'].loading_scene = true;

      this.$nextTick(() => {
        fetch(url).then((result) => {
          result.json().then((obj) => {
            app.unserialize(obj);
            app.$refs['sequencer'].loading_scene = false;
          })
        });
      });
    },
    serialize(minimal){
      /*
        Minimal will be useful for multi-user sync
       */
      let data = {};
      minimal = minimal || false;

      if(!minimal){
        // Attached current textures so we don't
        // have to render them on the server
        this.player.attach_textures();
        // Attach current uniform values
        this.player.attach_uniforms();
        // Attach current audio seqences
        data.saved_audio_sequences = this.player.export_audio_sequences();
      }

      data.project_id = this.project_id;
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
    },
    launch_template_selector(){
      this.$refs['sequencer'].launch_template_selector();
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

    app.player.canvas.classList.add("main-canvas");

    let container = document.querySelectorAll("#main-player .canvas-container")[0];
    app.player.set_container(container);
    this.switch_panel(0);
    this.$refs['panel-selector'].switch_to(0);
    this.pause();
  },
});
