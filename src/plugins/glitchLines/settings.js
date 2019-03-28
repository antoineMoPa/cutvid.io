/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "glitchLines";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Glitch Lines",
      ui: {
        template: `
<div>
  <label>Strength<br>
    <input v-model="uniforms.strength.value" 
           type="number" min="0.0" max="2.0" step="0.1">
  </label>
  <label>Image distortion<br>
    <input v-model="uniforms.distort.value" 
           type="number" min="0.0" max="1.0" step="0.1">
  </label>
  <label>Line density<br>
    <input v-model="uniforms.lineDensity.value" 
           type="number" min="0.0" max="100.0" step="1.0">
  </label>
  <label>Vertical glitching factor<br>
    <input v-model="uniforms.verticalGlitch.value" 
           type="number" min="0.0" max="1.0" step="0.1">
  </label>
  <label>Vertical glitching density<br>
    <input v-model="uniforms.verticalDensity.value" 
           type="number" min="0.0" max="199.0" step="1.0">
  </label>
</div>`,
        data: function(){
          return {
            uniforms: {
              distort: {
                type: "f",
                len: 1,
                value: 0.1,
              },
              strength: {
                type: "f",
                len: 1,
                value: 0.5,
              },
              lineDensity: {
                type: "f",
                len: 1,
                value: 4.0,
              },
              verticalGlitch: {
                type: "f",
                len: 1,
                value: 0.5,
              },
              verticalDensity: {
                type: "f",
                len: 1,
                value: 4.0,
              },
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
