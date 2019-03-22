{
  let name = "blankEffect";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Blank Effect",
      ui: {
        template: `
<div>
  <label>
    Fragment Shader<br>
    <textarea v-model="fragment" 
      style="width:305px; min-height:400px;resize:vertical;tab-size : 4;"></textarea>
  </label>
  <p>Pro tip: Use Firefox Shader editor (F12), ShaderGif or ShaderToy to prototype big chunks of code.</p>
  <p>Pro tip: Launch browser console (F12) to see GLSL errors.</p>
</div>`,
        data: function(){
          return {
            fragment: "",
            uniforms: {
            
            }
          };
        },
        props: ["player", "effect", "shaderProgram"],
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
          this.effect.uniforms = this.uniforms;
          this.fragment = this.effect.shaderProgram.fragment_shader_code;
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
