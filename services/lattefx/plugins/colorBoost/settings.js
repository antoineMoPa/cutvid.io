/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "colorBoost";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "colorBoost",
      ui: {
        template: `
<div>
  <h3>Linear boost</h3>
  <label>Red|Green|Blue</label>
  <input v-model="uniforms.r.value" size="4" type="number" min="0" max="3" step="0.1">
  <input v-model="uniforms.g.value" size="4" type="number" min="0" max="3" step="0.1">
  <input v-model="uniforms.b.value" size="4" type="number" min="0" max="3" step="0.1">
  <br>
  <h3>Exponent tweak</h3>
  <label>Red|Green|Blue</label>
  <input v-model="uniforms.r_exp.value" size="4" type="number" min="-100" max="100" step="1.0">
  <input v-model="uniforms.g_exp.value" size="4" type="number" min="-100" max="100" step="1.0">
  <input v-model="uniforms.b_exp.value" size="4" type="number" min="-100" max="100" step="1.0">
</div>`,
        data: function(){
          return {
            color: "#000000",
            uniforms: {
              r: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              g: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              b: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              r_exp: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              g_exp: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              b_exp: {
                type: "f",
                len: 1,
                value: 1.0,
              }
            }
          };
        },
        props: ["player", "effect"],
        methods: {
        },
        watch: {
        },
        mounted(){
        }
      }
    }
  };



  utils.plugins[name + "-effectSettings"] = effectSettings;
}
