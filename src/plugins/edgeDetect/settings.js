{
  let name = "edgeDetect";
  
  let effectSettings = function(){
	return {
	  name: name,
	  human_name: "Edge detect",
	  ui: {
		template: `
<div>
  <label>Edge detection offset</label>	   
  <input type="number" min="0.0" max="0.1" step="0.0004" v-model="uniforms.offset.value">
  <label>Color boost</label>	   
  <input type="number" min="0.0" max="10.0" step="0.1" v-model="uniforms.boost.value">
</div>`,
		data: function(){
		  return {
			uniforms: {
			  offset: {
				type: "f",
				len: 1, /* float, not a vector: len = 1*/
				value: 0.0005,
			  },
			  boost: {
				type: "f",
				len: 1,
				value: 3.0,
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
