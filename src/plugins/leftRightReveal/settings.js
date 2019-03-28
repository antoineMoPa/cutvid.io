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
  </label>
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
