/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "colorAlphaReplace";
  
  let effectSettings = function(){
	return {
	  name: name,
	  human_name: "Color Alpha Replace",
	  ui: {
		template: `
<div>
  <label>Color</label>
  <input v-model="color" type="color">
</div>`,
		data: function(){
		  return {
			color: "#000000",
			uniforms: {
			  r: {
				type: "f",
				len: 1,
				value: 0.0,
			  },
			  g: {
				type: "f",
				len: 1,
				value: 0.0,
			  },
			  b: {
				type: "f",
				len: 1,
				value: 0.0,
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
