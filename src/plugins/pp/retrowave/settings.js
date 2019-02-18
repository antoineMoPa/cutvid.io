{
  
  let name = "retrowave";
  
  let settingsPP = {
	name: name,
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
  };
  
  utils.plugins[name + "-settingsPP"] = settingsPP;
}
