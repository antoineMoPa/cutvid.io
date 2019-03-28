/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "glitch";

  let effectSettings = function(){
	return {
	  name: name,
	  human_name: "Glitch",
	  ui: {
		template: `
<div>
  <label>
    Strength<br>
    <input type="number" min="0.0" max="5.0" step="0.05" v-model="uniforms.strength.value">
  </label>
  <label>
    Dynamic Displacement<br>
    <input type="number" min="0.0" max="1.0" step="0.1" v-model="uniforms.displace.value">
  </label>
</div>`,
		data: function(){
		  return {
			uniforms: {
			  strength: {
				type: "f",
				len: 1, /* float, not a vector: len = 1*/
				value: 0.5,
			  },
			  displace: {
				type: "f",
				len: 1,
				value: 0.1,
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
