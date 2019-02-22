{
  let name = "vignette";
  
  let settingsPP = function(){
	return {
	  name: name,
	  human_name: "Vignette",
	  ui: {
		template: `
<div>
  <input type="number" min="0.0" max="1.0" step="0.05" v-model="uniforms.strength.value">
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
		props: ["player"],
		methods: {
		},
		watch: {
		  "uniforms": {
			handler(){
			  this.$emit("uniforms", this.uniforms);
			},
			deep: true
		  }
		},
		mounted(){
		  this.$emit("uniforms", this.uniforms);
		}
	  }
	}
  };
  
  
  
  utils.plugins[name + "-settingsPP"] = settingsPP;
}
