{
  let name = "default";
  
  let settingsPP = function(){
	return {
	  loadProgram: function(gl, onProgramReady){
		
	  },
	  name: name,
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
		},
	  }
	}
  };
  
  
  
  utils.plugins[name + "-settingsPP"] = settingsPP;
}
