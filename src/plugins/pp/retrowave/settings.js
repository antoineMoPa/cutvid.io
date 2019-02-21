{
  let name = "retrowave";
  
  let settingsPP = function(){
	return {
	  name: name,
	  human_name: "Retrowave",
	  ui: {
		template: `
<div>
</div>`,
		data: function(){
		  return {
		  };
		},
		props: ["player"],
		methods: {
		},
		watch: {
		}
	  }
	}
  };
  
  utils.plugins[name + "-settingsPP"] = settingsPP;
}
