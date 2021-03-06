Vue.component('player', {
  template:
  `<div class="player">
    <div v-bind:class="'settings-panel rendering-info-panel ' +
                       (player == null || !player.rendering?
                       'settings-panel-hidden':
                       '')">
      <p>Rendering in progress</p>
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
        <a class="preset" v-on:click="set_dimensions(1280,720,30)">HD 720p</a> -
        <a class="preset" v-on:click="set_dimensions(1280,720,30)">Facebook video</a> -
        <a class="preset" v-on:click="set_dimensions(600,315,30)">Instagram Ad</a> -
        <a class="preset" v-on:click="set_dimensions(864,1080,30)">Instagram Video</a> -
        <a class="preset" v-on:click="set_dimensions(1920,1080,30)">Full HD 1080p</a>
        <label>FPS (frames per seconds)</label>
        <input v-model.number="fps" type="number">
        <br>
        <h4>Load a .cutvidio project</h4>
        <p>If you saved a project to your computer, you can upload it here.</p>
        <label>
          <button v-on:click="browse_file">Upload Existing Project</button>
          <input type="file"
                 class="hidden project-file-input"
                 v-on:change="onLoadCutvidioFile"/>
        </label>
      </div>
      <div class="switchable-panel media-sources-panel">
        <h4>Media sources</h4>
        <p>Monitor this project's videos here.</p>
      </div>
    </div>
    <div id="main-player">
      <div class="canvas-container">
      </div>
      <div class="player-overlay">
        <div v-if="enable_resize_draggers" class="dragger right-dragger"></div>
        <div v-if="enable_resize_draggers" class="dragger bottom-dragger"></div>
        <div v-if="enable_resize_draggers" class="dragger top-dragger"></div>
        <div v-if="enable_resize_draggers" class="dragger left-dragger"></div>
        <template v-if="player != null && !player.rendering && player.sequences.length > 0">
          <a class="play-button"
             v-on:click="play()"
             v-if="player.paused">
             <img class="play-icon feather-button"
                  src="icons/feather/play.svg"/>
          </a>
          <a v-else
             class="pause-button"
             v-on:click="pause()">
             <img class="pause-icon feather-button"
                  src="icons/feather/pause.svg"/>
          </a>
          <a class="ui-button render-button button-1"
             v-if="!player.rendering &&
                   player.sequences.length > 0"
             v-on:click="render">
            <img class="feather-button"
                 src="icons/feather/download.svg"/>
              Render
          </a>
        </template>
      </div>
      <sequencer
        ref="sequencer"
        v-on:playLooping="playLooping"
        v-on:resize="on_resize"
        v-bind:player="player"
     />
    </div>
    <render-settings/>
    <download-video ref="download_video"
                    v-bind:settings="settings"
                    v-bind:user_info="user_info"/>
    <ui ref="ui"
        v-on:playAll="playAll"
        v-bind:user_info="user_info"
        v-bind:player="player"/>
  </div>`,
  data(){
    return {
      player: null,
      width: parseInt(1920/2),
      height: parseInt(1080/2),
      aspect: 1920.0/1080,
      right_panel_width: 0,
      scale: 1.0,
      user_token: null,
      expert_mode: true,
      fps: 30,
      watermark: "",
      project_id: null,
      user_info: null,
      saving: false,
      show_saved_message: false,
      enable_resize_draggers: config.features.resize_draggers
    };
  },
  props: ["settings"],
  methods: {
    expose(){
      let API = window.API;

      API.expose({
        name: "player.panel.save_cutvidio_file",
        doc: `Save current project file

        You can use this file to keep a copy of the project and re-import it later.
        `,
        fn: function(){
          this.save_cutvidio_file();
        }.bind(this)
      });

      API.expose({
        name: "player.panel.open_cutvidio_file",
        doc: `Open a current project file

        Re-import a cutvidio project file.
        `,
        fn: function(){
          this.browse_file();
        }.bind(this)
      });

      API.expose({
        name: "player.panel.switch_to_effect_settings",
        doc: `Go to the "effects settings" panel

        `,
        fn: function(){
          this.$refs['panel-selector'].switch_to(0);
        }.bind(this)
      });

      API.expose({
        name: "player.set_right_panel_width",
        doc: `Set Right Panel Width

        This is used to make space for the dev panel.

        `,
        fn: function(width){
          this.right_panel_width = width;
          this.on_resize();
        }.bind(this),
        no_ui: true
      });

      API.expose({
        name: "player.reset_trim",
        doc: `Reset Trim

        `,
        fn: function(){
          this.width = parseInt(
            this.player.width - this.player.cut_left + this.player.cut_right
          );

          this.height = parseInt(
            this.player.height - this.player.cut_bottom + this.player.cut_top
          );

          this.player.cut_right = 0;
          this.player.cut_left = 0;
          this.player.cut_bottom = 0;
          this.player.cut_top = 0;

          this.update_dimensions();
        }.bind(this)
      });

      API.expose({
        name: "player.render",
        doc: `Render

        `,
        fn: function(){
          return new Promise(function(resolve){
            this.render();
          }.bind(this));
        }.bind(this),
        no_ui: true
      });

      API.expose({
        name: "player.export_audio_sequences",
        doc: `Get all audio sequences for mixing/rendering
        `,
        fn: function(){
          return this.player.export_audio_sequences();
        }.bind(this),
        no_ui: true
      });
    },
    browse_file(){
      this.$el.querySelectorAll(".project-file-input")[0].click();
    },
    set_dimensions(w, h, fps){
      this.width = w;
      this.height = h;
      this.fps = fps;
      this.update_dimensions();
    },
    play(){
      this.player.play();
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
    on_user_info(data){
      this.user_info = data;
    },
    on_resize(){
      let app = this;
      let left_panel_width = 315;
      let right_panel_width = this.right_panel_width;

      let sequencer = document.querySelectorAll("#main-player .sequencer")[0];

      // left theme settings panel and margin
      let x_spacing = 60 + left_panel_width + right_panel_width + 40;
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

      // Used for draggers
      this.scale = displayed_w / this.width;

      let canvas_container = document.querySelectorAll("#main-player .canvas-container")[0];
      let player_overlay = document.querySelectorAll("#main-player .player-overlay")[0]

      sequencer.style.width =
        (x_available_space - x_spacing) + "px";
      sequencer.style.top =
        (y_available_space - y_spacing + 35) + "px";

      sequencer.style.left = (x_spacing - right_panel_width - 20) + "px";

      player_overlay.style.maxWidth =
        app.player.canvas.style.maxWidth =
        (displayed_w) + "px";
      player_overlay.style.maxHeight =
        app.player.canvas.style.maxHeight =
        (displayed_h) + "px";

      player_overlay.style.width =
        app.player.canvas.style.width =
        (displayed_w) + "px";
      player_overlay.style.height =
        app.player.canvas.style.height =
        (displayed_h) + "px";


      player_overlay.style.position =
        canvas_container.style.position = "absolute";

      player_overlay.style.top =
        canvas_container.style.top = 0 + "px";

      let x_align_center = parseInt((x_available_space - x_spacing - available_size) / 2);
      player_overlay.style.left =
        canvas_container.style.left =
        x_spacing - 20 - right_panel_width + x_align_center + "px";

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
    render() {
      let totalFrames = this.fps * this.player.get_total_duration();
      this.player.rendering = true;
      this.player.pause();
      this.player.render();
    },
    onCancelRender(){
      this.player.cancel_render();
    },
    async save_cutvidio_file(){
      let data = this.serialize();
      let file_store = await this.player.file_store._export();

      let data_plus_file_store = JSON.stringify({
        data: data,
        file_store: file_store
      });

      let a = document.createElement("a");
      var blob = new Blob([data_plus_file_store], {type : 'text/json'});
      var url = URL.createObjectURL(blob);
      a.href = url;
      a.download = "videodata.cutvidio";
      document.body.appendChild(a);
      a.click();
      fetch("/stats/cutvidio_save_file/");
    },
    onLoadCutvidioFile(e){
      let file = e.target.files[0];
      var reader = new FileReader();
      reader.addEventListener("loadend", async function() {
        let data_plus_file_store = JSON.parse(reader.result);
        await this.player.file_store._import(data_plus_file_store.file_store);
        this.unserialize(data_plus_file_store.data);
      }.bind(this));
      reader.readAsText(file);

      fetch("/stats/cutvidio_load_file/");
    },
    loadCutvidioFile(url){
      let app = this;
      console.error("This function is probably broken.");
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

      data.width = this.width;
      data.height = this.height;
      data.fps = this.fps;
      data.cut_bottom = this.player.cut_bottom;
      data.cut_left = this.player.cut_left;
      data.cut_right = this.player.cut_right;
      data.cut_top = this.player.cut_top;
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
    },
    init_draggers(){
      if (!config.features.resize_draggers)
        return;

      let player_overlay = this.$el.querySelectorAll(".player-overlay")[0];

      let sides = [{
        position: "right",
        direction: 1,
        event_prop: "clientX",
        object_prop: "width",
        dragger: this.$el.querySelectorAll(".right-dragger")[0]
      }, {
        position: "bottom",
        direction: 1,
        event_prop: "clientY",
        object_prop: "height",
        dragger: this.$el.querySelectorAll(".bottom-dragger")[0]
      }, {
        position: "left",
        direction: -1,
        event_prop: "clientX",
        object_prop: "width",
        dragger: this.$el.querySelectorAll(".left-dragger")[0]
      },{
        position: "top",
        direction: -1,
        event_prop: "clientY",
        object_prop: "height",
        dragger: this.$el.querySelectorAll(".top-dragger")[0]
      },];

      for(let i in sides){
        const {
          position,
          direction,
          event_prop,
          object_prop,
          dragger
        } = sides[i];

        dragger.addEventListener("mousedown", function(e){
          e.preventDefault();
          dragger.classList.add("moving");

          let scale = this.scale;
          let initial = e[event_prop];
          let initial_player_size = this[object_prop];

          initial = e[event_prop];

          let move_listener = function(e, finalize=false){
            current = e[event_prop];
            delta = -(current - initial) / scale;

            dragger.style[position] = direction * delta*scale + "px";

            if (finalize){
              let new_size = (initial_player_size - direction * delta) * scale;

              if(position == "bottom"){
                this.player.cut_bottom -= delta;
              } else if(position == "left"){
                this.player.cut_left += delta;
              } else if(position == "right"){
                this.player.cut_right += delta;
              } else if(position == "top"){
                this.player.cut_top -= delta;
              }

              this[object_prop] = new_size / scale;
              player_overlay.style[object_prop] = new_size + "px";
              dragger.style[position] = -3 + "px";

              this.update_dimensions();
            }
          }.bind(this);

          window.addEventListener("mousemove", move_listener);

          window.addEventListener("mouseup", function(e){
            e.preventDefault();
            dragger.classList.remove("moving");
            move_listener(e, true);
            window.removeEventListener("mousemove", move_listener);
          }, {once: true});
        }.bind(this));
      }
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
    },
    async settings(){
      await this.$nextTick();
    }
  },
  mounted: async function (){
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

    await this.$nextTick();

    this.expose();
    this.init_draggers();
  },
});
