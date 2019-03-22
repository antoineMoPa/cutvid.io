{
  let name = "glitchLines";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Glitch Lines",
      ui: {
        template: `
<div>
  
</div>`,
        data: function(){
          return {
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
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
