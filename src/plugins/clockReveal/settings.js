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

		  },
		  beforeRender(player, time, currentScene){
			player.renderPreviousScene(time, currentScene);
		  }
		},
		watch: {
		},
		mounted(){
		  this.updateTexts();
          this.effect.uniforms = this.uniforms;
		  this.effect.beforeRender = this.beforeRender;
		}
	  }
	};
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
