var app = new Vue({
  el: '#main_app',
  data: {
    settings: null,
    navigator_supported: true,
    resources_menu_open: false,
    file_menu_open: false,
    edit_menu_open: false
  },
  template: `<div>
               <header>
                 <a href="https://lattefx.com/" target="_blank">
                   <img src="images/logo.png" class="header-logo" alt="Latte fx"/>
                 </a>
                 <div class="app-menu-links">
                   <a href="#" v-on:click="toggle_menu('file_menu_open')">
                     File
                   </a>
                   <a href="#" v-on:click="toggle_menu('resources_menu_open')">
                     Resources
                   </a>
                 </div>
               </header>
               <div class="application-menus">
                 <div class="application-menu resources-menu" v-if="resources_menu_open">
                   <p>LatteFx help</p>
                   <a href="/landing/lattefx_intro_pdf_dec_2019.pdf"
                      target="_blank">LatteFx intro PDF</a><br>
                   <br>
                   <p>Free content for your videos</p>
                   <a href="https://www.bensound.com/"
                      target="_blank"
                      class="external-link">Free music - Bensound</a><br>
                   <a href="https://www.pexels.com/videos/"
                      target="_blank"
                      class="external-link">Free stock videos - Pexels</a>
                 </div>
                 <div class="application-menu file-menu"
                    v-if="file_menu_open && settings != null">
                   <a v-on:click="browse_projects">
                     Your projects
                   </a><br>
                   <a v-bind:href="settings.app + '/renders'"
                      target="_blank">
                     Render tracker
                   </a>
                 </div>
               </div>
               <player ref="player" v-bind:settings="settings"></player>
               <div v-if="!navigator_supported" class="navigator-no-support">
                 <p style="font-weight:500;font-size:24px;">
                   Please open Lattefx in Chrome or Firefox
                 </p>
                 <p>
                   Currently, only Chrome and Firefox are supported.<br>
                   We use advanced WebGL rendering techniques that we cannot support<br> in other browsers due to limited time in life.
                 </p>
                 <input type="text" value="https://lattefx.com"></input>
                 <p style="font-size:10px;margin-top:0px;">Go ahead, copy paste in Chrome or Firefox!</p>
                 <p>
                   You can download Firefox at <a href="https://www.mozilla.org/en-CA/firefox/new/" target="_blank">mozilla.org</a>
                 </p>
                 <br><br>
                 <p style="font-size:11px;">
                   You can still try running Lattefx at your own risk:
                   <a v-on:click="navigator_supported = true" style="color:#3af;cursor:pointer;">
                     try anyway
                   </a>
                 </p>
               </div>
             </div>`,
  methods: {
    toggle_menu(menu_name){
      let menus = ["resources_menu_open", "file_menu_open"];

      if(this[menu_name]){
        this[menu_name] = false;
      } else {
        for(let i = 0; i < menus.length; i++){
          if(menus[i] == menu_name){
            this[menus[i]] = true;
          } else {
            this[menus[i]] = false;
          }
        }
      }
    },
    browse_projects(){
      let cloud_url = this.settings.cloud;
      let player = this.$refs["player"];

      player.$refs['projects'].open();
      player.$refs['projects'].on_open_project = async (project) => {
        let auth = window.auth;
        let token = await auth.get_token();
        player.project_id = project.id;

        player.$refs['sequencer'].loading_scene = true;

        await player.$nextTick();

        let req = await fetch(cloud_url + "/project/" + project.id, {
          headers: {
            'Authorization': 'Bearer ' + token,
          }
        });
        let data = await req.json();

        player.$refs['sequencer'].loading_scene = true;
        player.unserialize(data);
        player.$refs['sequencer'].loading_scene = false;
      };
    }
  },
  mounted(){
    let app = this;

    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('safari') != -1) {
      if (ua.indexOf('chrome') <= -1) {
        app.navigator_supported = false;
        console.log("safari detected");
      }
    }

    if (document.documentMode || /Edge/.test(navigator.userAgent)) {
      app.navigator_supported = false;
      console.log("Edge detected");
    }

    if (navigator.userAgent.indexOf("OPR") !== -1) {
      app.navigator_supported = false;
      console.log("Opera detected");
    }

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
