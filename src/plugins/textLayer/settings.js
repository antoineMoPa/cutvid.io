{
  let name = "textLayer";
  
  let settingsPP = function(){
	return {
	  name: name,
	  human_name: "Text Layer",
	  ui: {
		template: `
<div>
  <p style="font-size:10px;">
    This effects puts the text on the canvas, you probably want to keep it!
  </p>
</div>
`,
		data: function(){
		  return {
			uniforms: {
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
