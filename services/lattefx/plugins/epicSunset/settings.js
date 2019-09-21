/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "epicSunset";
  
  let effectSettings = function(){
	return {
	  name: name,
	  human_name: "Epic Sunset",
	  ui: {
		template: `
<div>
  <!--
  <label>Glitch Factor</label>
  <input v-model.number="uniforms.glitchFactor.value" min="0.0" max="2.0" step="0.1" type="number">
  -->
</div>`,
		data: function(){
		  return {
			uniforms: {
			  glitchFactor: {
				type: "f",
				len: 1,
				value: 0.5,
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
		  document.fonts.ready.then(this.updateTexts);
		}
	  }
	}
  };
  
  utils.plugins[name + "-effectSettings"] = effectSettings;
}
