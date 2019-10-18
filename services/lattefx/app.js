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
        // These are settings that never change during an apps
        // lifetime, so might as well set it globally
        window.lattefx_settings = data;
      });
    });
  }
})
