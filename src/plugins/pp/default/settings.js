{
  let name = "default";
  
  let settingsPP = {
	template: `
<div>
  <h4>Epic Sunset</h4>
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
