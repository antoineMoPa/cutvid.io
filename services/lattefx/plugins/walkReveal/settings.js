/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
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
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
