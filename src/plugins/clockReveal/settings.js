{
  let name = "clockReveal";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Clock Reveal",
      ui: {
        template: `
<div>
  <label>
    Transition time (0 = instant, 1 = length of scene)<br>
    <input type="number" min="0.0" step="0.1" max="1.0"
           v-model="uniforms.transitionTime.value">
  </label>
</div>`,
        data: function(){
          return {
            logo: null,
            backgroundColor: "#000000",
            uniforms: {
              logoWidth: {
                type: "f",
                len: 1,
                value: 1,
              },
              transitionTime: {
                type: "f",
                len: 1,
                value: 0.3,
              },
            }
          };
        },
        props: ["player", "effect", "shaderProgram"],
        methods: {
          updateTexts(){

          },
          beforeRender(player, time, currentScene){
            player.renderPreviousScene(time, currentScene);
          }
        },
        watch: {
        },
        mounted(){
          this.updateTexts();
          this.effect.uniforms = this.uniforms;
          this.effect.beforeRender = this.beforeRender;
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
