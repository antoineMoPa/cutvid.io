let dev = {};

dev.shader_editor = async function(){
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

  let cm = CodeMirror(container, {
    value: current_sequence.effect.shaderProgram.fragment_shader_code,
    mode: "text/x-csrc",
    theme: theme
  });

  cm.on("change", function(){
    let fragment = cm.getValue();
    // Recompile
    let program = current_sequence.effect.shaderProgram;
    program.compile(program.vertex_shader_code, fragment);
  }.bind(this));

};


window.API.expose({
  name: "dev.shader_editor",
  doc: `Effect shader editor

        Launch the fragment shader editor for the current effect.
        `,
  fn: function(){
    dev.shader_editor();
  }.bind(this)
});
