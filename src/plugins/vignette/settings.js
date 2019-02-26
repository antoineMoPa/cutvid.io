{
  let name = "vignette";
  
  let effectSettings = function(){
	return {
	  name: name,
	  human_name: "Vignette",
	  ui: {
		template: `
<div>
  <input type="number" min="0.0" max="5.0" step="0.05" v-model="uniforms.strength.value">
</div>`,
		data: function(){
		  return {
			uniforms: {
			  strength: {
				type: "f",
				len: 1, /* float, not a vector: len = 1*/
				value: 0.5,
			  }
			}
		  };
		},
		props: ["player", "effect"],
		methods: {
		},
		watch: {
		  "uniforms": {
			handler(){
			},
			deep: true
		  }
		},
		mounted(){
		  this.effect.uniforms = this.uniforms;
		}
	  }
	}
  };
  
  
  
  utils.plugins[name + "-effectSettings"] = effectSettings;
}
