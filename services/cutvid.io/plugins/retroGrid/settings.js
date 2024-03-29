/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "retroGrid";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Retro Grid",
      ui: {
        template: `
<div>
  <label>Color<br><br>
    <input v-model="color" type="color">
  </label>
  <label>Top offset<br><br>
    <input v-model="uniforms.offsetY.value"
           min="-0.5" max="5" step="0.05" type="number">
  </label>
</div>`,
        data: function(){
          return {
            color: '#FB59F7',
            uniforms: {
              r: {
                type: "f",
                len: 1,
                value: 251.0/255.0,
              },
              g: {
                type: "f",
                len: 1,
                value: 89.0/255.0,
              },
              b: {
                type: "f",
                len: 1,
                value: 247.0/255.0,
              },
              offsetY: {
                type: "f",
                len: 1,
                value: 0.0,
              },
            }
          };
        },
        props: ["player", "effect", "shaderProgram"],
        methods: {
        },
        watch: {
          "color": {
            handler(){
              this.uniforms.r.value = parseInt(this.color.substring(1,3), 16)/255;
              this.uniforms.g.value = parseInt(this.color.substring(3,5), 16)/255;
              this.uniforms.b.value = parseInt(this.color.substring(5,7), 16)/255;
            },
            deep: true
          }
        },
        mounted(){
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
