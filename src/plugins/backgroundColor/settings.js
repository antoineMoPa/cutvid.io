{
  let name = "backgroundColor";
  
  let effectSettings = function(){
	return {
	  name: name,
	  human_name: "Background color",
	  ui: {
		template: `
<div>
  <label>Color</label>
  <input v-model="color" type="color">
</div>`,
		data: function(){
		  return {
			color: "#ffffff",
			uniforms: {
			  r: {
				type: "f",
				len: 1,
				value: 1.0,
			  },
			  g: {
				type: "f",
				len: 1,
				value: 1.0,
			  },
			  b: {
				type: "f",
				len: 1,
				value: 1.0,
			  },
			}
		  };
		},
		props: ["player", "effect"],
		methods: {
		},
		watch: {
		  "color": {
			handler(){
			  this.uniforms.r.value = parseInt(this.color.substring(1,3), 16)/255;
			  this.uniforms.g.value = parseInt(this.color.substring(3,5), 16)/255;
			  this.uniforms.b.value = parseInt(this.color.substring(5,7), 16)/255;
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
