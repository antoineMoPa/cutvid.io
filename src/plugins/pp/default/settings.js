{
  let name = "default";
  
  let settingsPP = {
	name: name,
	ui: {
	  template: `
<div>
  <h4>Epic Sunset</h4>
  
  palsdpsalda
asdasdaskdmasldma
daskldasmlkd
asddmkasd

</div>`,
	  data: function(){
		return {
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
	  }
	}
  };
  
  utils.plugins[name + "-settingsPP"] = settingsPP;
}
