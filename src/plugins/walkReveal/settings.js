{
  let name = "walkReveal";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Walk Reveal",
      ui: {
        template: `
<div>
  <label>
    Part screen divisions<br>
    <input v-model="uniforms.walkDimension.value"
           min="1.0" max="100.0" step="1.0" type="number">
  </label>
</div>`,
        data: function(){
          return {
            fragment: "",
            uniforms: {
              walkDimension: {
                type: "f",
                len: 1,
                value: 10.0,
              },
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
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
