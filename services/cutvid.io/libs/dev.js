let dev = {};

dev.load_codemirror = async function(theme){
  let codemirror_url = "https://cdn.jsdelivr.net/npm/codemirror@5.52.2/lib/codemirror.min.js";
  let codemirror_clike_url = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.52.2/mode/clike/clike.min.js";

  await utils.load_script(codemirror_url);
  await utils.load_script(codemirror_clike_url);

  if(document.querySelectorAll("link[name=codemirror-style]").length == 0){
    let link = document.createElement("link");
    link.name = "codemirror-style";
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.52.2/codemirror.min.css"

    document.head.appendChild(link);
  }

  if(document.querySelectorAll("link[name=codemirror-theme-stype]").length == 0){
    let link = document.createElement("link");
    link.name = "codemirror-theme-style";
    link.rel = "stylesheet";
    link.href =
      "https://cdnjs.cloudflare.com"+
      "/ajax/libs/codemirror/5.52.2/theme/"+
      theme + ".min.css";
    document.head.appendChild(link);
  }
};

dev.editor_component = Vue.component('effect-editor', {
  template: `
  <div class="effect-editor">
    <panel-selector ref="panel-selector"
                    v-bind:panelNames="['settings.js', 'fragment.glsl', 'vertex.glsl (global)']"
                    v-on:switch="switch_panel"/>
    <div class="switchable-panel">
      <div ref="settings_container"></div>
      <button class="reset-effect ui-button"
              v-on:click="reload_effect">
        <img class="reload-icon"
             src="icons/feather/refresh-cw.svg"/>
        Update Effect
      </button>
    </div>
    <div class="switchable-panel">
      <div ref="fragment_container"></div>
    </div>
    <div class="switchable-panel">
      <div ref="vertex_container"></div>
    </div>
    <img src="icons/feather/x.svg" class="close-button" v-on:click="close"/>
  </div>`,
  data(){
    return {
      width: 500,
      codemirror_theme: "mbo"
    };
  },
  methods: {
    reload_effect(){
      let new_code = this.settings_codemirror.getValue();
      eval(new_code);
      window.API.call("sequencer.reload_sequence", this.sequence);
    },
    switch_panel(i){
      // Hide previously shown
      this.$el.querySelectorAll(".switchable-panel-shown").forEach((el) => {
        el.classList.remove("switchable-panel-shown");
      });

      let panel = this.$el.querySelectorAll(".switchable-panel");
      // Show current panel
      panel[i].classList.add("switchable-panel-shown");

      if(i == 0 && this.settings_codemirror){
        this.settings_codemirror.refresh();
      }
      if(i == 1 && this.fragment_codemirror){
        this.fragment_codemirror.refresh();
      }
      if(i == 2 && this.vertex_codemirror){
        this.vertex_codemirror.refresh();
      }

    },
    async init_editor(mode){
      /*
        mode is either "settings", "vertex" or "fragment"
      */
      let current_sequence = window.API.call("sequencer.get_active_sequence");
      this.sequence = current_sequence;

      let value;
      let container = null;

      container = this.$refs[mode + "_container"];

      switch(mode){
      case "fragment":
        value = current_sequence.effect.shaderProgram.fragment_shader_code;
        break;
      case "vertex":
        value = current_sequence.effect.shaderProgram.vertex_shader_code;
        break;
      case "settings":
        let url = "plugins/" + current_sequence.effect.effectName + "/settings.js";
        let script_fetch = await fetch(url);
        let script = await script_fetch.text();
        value = script;
        break;
      default:
        console.error("invalid mode");
      }

      let cm = CodeMirror(container, {
        value: value,
        mode: "text/x-csrc",
        theme: this.codemirror_theme
      });

      this[mode + '_codemirror'] = cm;

      let width = this.width;

      cm.setSize(width);

      cm.on("change", function(){
        let code = cm.getValue();
        // Recompile
        let program = current_sequence.effect.shaderProgram;

        if(mode == "fragment"){
          program.compile(program.vertex_shader_code, code);
        } else if (mode == "vertex") {
          program.compile(code, program.fragment_shader_code);
        } else {
          // nothing to do before "Update Effect" button press
        }
      }.bind(this));
    },
    close(){
      window.API.call("player.set_right_panel_width", 0);
      this.$el.parentNode.removeChild(this.$el);
      this.$destroy();
    }
  },
  async mounted(){
    this.$refs['panel-selector'].switch_to(0);
    this.$el.style.width = this.width + "px";
    window.API.call("player.set_right_panel_width", this.width);

    await dev.load_codemirror(this.codemirror_theme);

    this.init_editor("settings");
    this.init_editor("fragment");
    this.init_editor("vertex");
  }
});



dev.effect_editor = async function(){
  let editor = new dev.editor_component();
  let container = document.createElement("div");
  container.classList.add("effect-editor")
  document.body.appendChild(container);
  editor.$mount(container);
};

window.API.expose({
  name: "dev.effect_editor",
  doc: `Effect Editor

        Launch the effect editor for the current effect.

        This includes the js editor, fragment shader editor and
        vertex shader editor.
        `,
  fn: function(){
    let current_sequence = window.API.call("sequencer.get_active_sequence");

    if(current_sequence == undefined){
      utils.flag_error("Please select a sequence before.");
      return;
    }

    dev.effect_editor();

  }.bind(this)
});
