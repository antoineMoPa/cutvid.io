var app = new Vue({
  el: '#main_app',
  data: {
	settings: null
  },
  template: `<div>
                 <player></player>
             </div>`,
  mounted(){
	fetch("settings.json").then((resp) => {
	  resp.json().then((data) => {
		window.settings = data;
	  });
	});
  }
})
