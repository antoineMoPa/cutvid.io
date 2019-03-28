/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "glow";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Glow",
      ui: {
        template: `
<div>
  <label>
    Intensity<br>
    <input v-model="uniforms.intensity.value" type="number"
      min="0.0"
      max="10.0"
      step="0.1">
  </label>
  <label>
    Modulation<br>
    <input v-model="uniforms.modulation.value" type="number"
      min="0.0"
      max="1.0"
      step="0.1">
  </label>
  <label>
    Horizontal time modulation<br>
    <input v-model="uniforms.xModulation.value" type="number"
      min="-100.0"
      max="100.0"
      step="1.0">
  </label>
  <label>
    Vertical time modulation<br>
    <input v-model="uniforms.yModulation.value" type="number"
      min="-100.0"
      max="100.0"
      step="1.0">
  </label>
  <label>
    Size<br>
    <input v-model="uniforms.size.value" type="number"
      min="0.001"
      max="0.1"
      step="0.0005">
  </label>
  <label>
    Color multiplier (r,g,b)<br>
    <input v-model="uniforms.rMult.value" type="number"
      min="0.0"
      max="3.0"
      step="0.1"
      style="width:40px">
    <input v-model="uniforms.gMult.value" type="number"
      min="0.0"
      max="3.0"
      step="0.1"
      style="width:40px">
    <input v-model="uniforms.bMult.value" type="number"
      min="0.0"
      max="3.0"
      step="0.1"
      style="width:40px">
  </label>
</div>`,
        data: function(){
          return {
            uniforms: {
              intensity: {
                type: "f",
                len: 1,
                value: 0.5,
              },
              size: {
                type: "f",
                len: 1,
                value: 0.003,
              },
              modulation: {
                type: "f",
                len: 1,
                value: 0.2,
              },
              xModulation: {
                type: "f",
                len: 1,
                value: 10.0,
              },
              yModulation: {
                type: "f",
                len: 1,
                value: 0.0,
              },
              rMult: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              gMult: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              bMult: {
                type: "f",
                len: 1,
                value: 1.0,
              }
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
          this.effect.beforeRender = this.beforeRender;
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
