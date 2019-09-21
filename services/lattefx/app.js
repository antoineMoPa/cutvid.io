var app = new Vue({
  el: '#main_app',
  data: {
	settings: null
  },
  template: `<div>
                 <player v-bind:settings="settings"></player>
             </div>`,
  mounted(){
	fetch("settings.json").then((resp) => {
	  resp.json().then((data) => {
		this.settings = data;
	  });
	});
  }
})
