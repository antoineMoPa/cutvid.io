/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "leftRightReveal";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Left-Right Reveal",
      ui: {
        template: `
<div>
  <label>
    Begin time (0.0 = scene begin, 1.0 = end of scene)<br>
    <input v-model="uniforms.beginAt.value"
           type="number"
           min="0.0" max="1.0" step="0.1">
  </label>
  <label>
    End time (0.0 = scene begin, 1.0 = end of scene)<br>
    <input v-model="uniforms.endAt.value"
           type="number"
           min="0.0" max="1.0" step="0.1">
  </label>
</div>`,
        data: function(){
          return {
            uniforms: {
              beginAt: {
                type: "f",
                len: 1,
                value: 0.0
              },
              endAt: {
                type: "f",
                len: 1,
                value: 1.0
              }
            }
          };
        },
        props: ["player", "effect", "shaderProgram"],
        methods: {
        },
        watch: {
        },
        mounted(){
          this.effect.uniforms = this.uniforms;
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
