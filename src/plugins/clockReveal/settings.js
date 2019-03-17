{
  let name = "clockReveal";
  
  let effectSettings = function(){
	return {
	  name: name,
	  human_name: "Clock Reveal",
	  ui: {
		template: `
<div>
</div>`,
		data: function(){
		  return {
            logo: null,
			backgroundColor: "#000000",
            uniforms: {
			  logoWidth: {
				type: "f",
				len: 1,
				value: 1,
			  },
			}
		  };
		},
		props: ["player", "effect", "shaderProgram"],
		methods: {
		  updateTexts(){
		  
		  }
		},
		watch: {
		},
		mounted(){
		  this.updateTexts();
          this.effect.uniforms = this.uniforms;
		}
	  }
	};
  };
	
  utils.plugins[name + "-effectSettings"] = effectSettings;
}
