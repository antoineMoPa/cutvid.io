{
  
  let name = "retrowave";
  
  let settingsPP = {
	template: `
<div>
  <h4>Retrowave</h4>
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
  };
  
  utils.plugins[name + "-settingsPP"] = settingsPP;
}
