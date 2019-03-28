/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "blankEffect";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Blank Effect",
      ui: {
        template: `
<div>
  <label>
    Fragment Shader<br>
    <textarea v-model="fragment" 
      style="width:305px; min-height:400px;resize:vertical;tab-size : 4;"></textarea>
  </label>
  <p>Pro tip: Use Firefox Shader editor (F12), ShaderGif or ShaderToy to prototype big chunks of code.</p>
  <p>Pro tip: Launch browser console (F12) to see GLSL errors.</p>
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
		  beforeRender(player, time, currentScene){
            player.renderPreviousScene(time, currentScene);
          }
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
          this.fragment = this.effect.shaderProgram.fragment_shader_code;
		  this.effect.beforeRender = this.beforeRender;
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
