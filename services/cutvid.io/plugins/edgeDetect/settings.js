/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
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
  <input type="number" min="0.0" max="0.1" step="0.0001" v-model="uniforms.offset.value">
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
		}
	  }
	}
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
