{
  let name = "blankEffect";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Blank Effect",
      ui: {
        template: `
<div>
  <p>Launch the "Effect Editor" in the command search
     bar to edit this plugin.</p>
</div>`,
        data: function(){
          return {
            effect: null,
            fragment: "",
            uniforms: {

            }
          };
        },
        methods: {
        },
        watch: {
          fragment(){
            // Recompile
            let program = this.effect.shaderProgram;
            program.compile(program.vertex_shader_code, this.fragment);
          }
        },
        mounted(){
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
