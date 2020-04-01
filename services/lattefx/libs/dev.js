let dev = {};

dev.shader_editor = async function(mode){
  /*
     mode is either "vertex" or "fragment"
  */
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

  let theme = "mbo";

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

  let current_sequence = window.API.call("sequencer.get_active_sequence");

  if(current_sequence == undefined){
    utils.flag_error("Please select a sequence before.");
    return;
  }

  let container = document.createElement("div");
  container.classList.add("shader-editor")
  document.body.appendChild(container);

  let value;

  if(mode == "fragment"){
    value = current_sequence.effect.shaderProgram.fragment_shader_code;
  } else {
    value = current_sequence.effect.shaderProgram.vertex_shader_code;
  }

  let cm = CodeMirror(container, {
    value: value,
    mode: "text/x-csrc",
    theme: theme
  });

  let width = 640;

  cm.setSize(width);

  cm.on("change", function(){
    let code = cm.getValue();
    // Recompile
    let program = current_sequence.effect.shaderProgram;

    if(mode == "fragment"){
      program.compile(program.vertex_shader_code, code);
    } else {
      program.compile(code, program.fragment_shader_code);
    }
  }.bind(this));

  let close_button = document.createElement("img");
  close_button.src = "icons/feather/x.svg";
  close_button.classList.add("close-button");
  close_button.onmousedown = function(){
    container.parentNode.removeChild(container);
    window.API.call("player.set_right_panel_width", 0);
  };
  container.appendChild(close_button);

  window.API.call("player.set_right_panel_width", width);
};

window.API.expose({
  name: "dev.shader_editor",
  doc: `Effect Shader Editor

        Launch the fragment shader editor for the current effect.
        `,
  fn: function(){
    dev.shader_editor("fragment");
  }.bind(this)
});

window.API.expose({
  name: "dev.vertex_shader_editor",
  doc: `Vertex Shader Editor

`,
  fn: function(){
    dev.shader_editor("vertex");
  }.bind(this)
});
