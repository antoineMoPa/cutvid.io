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
