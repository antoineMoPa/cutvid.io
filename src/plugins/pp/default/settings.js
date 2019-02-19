{
  let name = "default";
  
  let settingsPP = function(){
	return {
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
		loadShaders(on_shaders_ready) {
		  this.vertex = "";
		  this.fragment = "";
		  
		  Promise.all([
			fetch("plugins/pp/" + name + "/vertex.glsl"),
			fetch("plugins/pp/" + name + "/fragment.glsl")
		  ]).then((values) => {
			Promise.all([
			  values[0].text(),
			  values[1].text()
			]).then((values) => {
			  let vertex = values[0];
			  let fragment = values[1];
			  
			  this.vertex = vertex;
			  this.fragment = fragment;
			  on_shaders_ready(vertex, fragment);
			});
		  });
		},
		methods: {
		},
		watch: {
		},
	  }
	}
  };
  
  utils.plugins[name + "-settingsPP"] = settingsPP;
}
