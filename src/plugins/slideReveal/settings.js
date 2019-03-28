/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "slideReveal";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Slide Reveal",
      ui: {
        template: `
<div>
  <label>
    Transition time (0 = instant, 1 = length of scene)<br>
    <input type="number" min="0.0" step="0.1" max="1.0"
           v-model="uniforms.transitionTime.value">
  </label>
  <label>
    "Sideways" factor<br>
    <input type="number" min="0.0" step="1.0" max="300.0"
           v-model="uniforms.sideWays.value">
  </label>
  <!--
  <label>
    Move content
    <input type="checkbox" v-model="moveContent">
  </label>
  -->
  <label>
    Reverse direction
    <input type="checkbox" v-model="reverse">
  </label>

</div>`,
        data: function(){
          return {
            fragment: "",
            reverse: false,
            moveContent: true,
            uniforms: {
              transitionTime: {
                type: "f",
                len: 1,
                value: 0.3,
              },
              sideWays: {
                type: "f",
                len: 1,
                value: 0.0,
              },
              direction: {
                type: "f",
                len: 1,
                value: 1.0,
              },
              moveContent: {
                type: "f",
                len: 1,
                value: 1.0,
              }
            }
          };
        },
        props: ["player", "effect", "shaderProgram"],
        methods: {
          beforeRender(player, time, currentScene){
            player.renderPreviousScene(time, currentScene);
          }
        },
        watch: {
          reverse(newReverseValue){
            this.uniforms.direction.value = newReverseValue? -1.0: 1.0;
          },
          moveContent(newMoveContentValue){
            this.uniforms.moveContent.value = newMoveContentValue? 1.0: 0.0;
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
