function expose_settings(settings){
  let API = window.API;

  API.expose({
    name: "settings",
    doc: `Global Settings Object

        `,
    fn: function(){
      return settings;
    }.bind(this),
    no_ui: true
  });
}

var app = new Vue({
  el: '#main_app',
  data: {
    settings: null,
    navigator_supported: true,
    resources_menu_open: false,
    file_menu_open: false,
    project_menu_open: false,
    edit_menu_open: false,
    sequencer: null,
    player: null
  },
  template: `<div>
               <header>
                 <a href="https://cutvid.io/" target="_blank">
                   <img src="images/logo.png" class="header-logo" alt="Latte fx"/>
                 </a>
                 <div class="app-menu-links">
                   <a href="#" v-on:click="toggle_menu('file_menu_open')">
                     File
                   </a>
                   <a href="#" v-on:click="toggle_menu('project_menu_open')">
                     Project
                   </a>
                   <a href="#" v-on:click="toggle_menu('edit_menu_open')">
                     Edit
                   </a>
                   <a href="#" v-on:click="toggle_menu('resources_menu_open')">
                     Resources
                   </a>
                 </div>
                 <console></console>
               </header>
               <div class="application-menus">
                 <div class="application-menu resources-menu" v-if="resources_menu_open">
                   <a href="https://cutvid.io/docs/"
                      target="_blank">Documentation</a><br>
                   <p>Free content for your videos</p>
                   <a href="https://www.bensound.com/"
                      target="_blank"
                      class="external-link">Free music - Bensound</a><br>
                   <a href="https://www.pexels.com/videos/"
                      target="_blank"
                      class="external-link">Free stock videos - Pexels</a>
                 </div>
                 <div class="application-menu edit-menu" v-if="edit_menu_open">
                   <a v-on:click="sequencer.copy()">Copy Sequences</a>
                   <span class="shortcut-hint">Ctrl+C</span>
                   <br>
                   <a v-on:click="sequencer.paste()">Paste Sequences</a>
                   <span class="shortcut-hint">Ctrl+V</span>
                   <br>
                   <hr>
                   <a v-on:click="sequencer.select_none()">Clear Selection</a><br>
                   <a v-on:click="sequencer.select_all()">Select All</a>
                   <span class="shortcut-hint">Ctrl +A</span>
                   <br>
                   <a v-on:click="sequencer.select_all_after_cursor()">
                     Select All After Cursor
                   </a><br>
                   <a v-on:click="sequencer.select_all_before_cursor()">
                     Select All Before Cursor
                   </a><br>
                   <a v-on:click="sequencer.select_inverse()">
                     Invert Selection
                   </a>
                 </div>
                 <div class="application-menu file-menu"
                    v-if="file_menu_open && settings != null">
                   <a v-on:click="browse_projects">
                     Your Projects
                   </a><br>
                   <a v-bind:href="settings.app + '/renders'"
                      target="_blank">
                     Render Tracker
                   </a>
                   <br>
                   <a v-on:click="player.save_video()">Save to cloud</a>
                   <span class="shortcut-hint">Ctrl+S</span>
                 </div>
                 <div class="application-menu project-menu"
                    v-if="project_menu_open && settings != null">
                   <a v-on:click="browse_projects">
                     Open a Project
                   </a><br>
                   <a v-on:click="api().call('player.save_project')">
                     Save Project
                   </a>
                   <span class="shortcut-hint">Ctrl+S</span><br>
                   <a v-on:click="api().call('player.reset_trim')">
                     Reset Trim
                   </a><br>
                 </div>
               </div>
               <player ref="player" v-bind:settings="settings"></player>
               <div v-if="!navigator_supported" class="navigator-no-support">
                 <p style="font-weight:500;font-size:24px;">
                   Please open cutvid.io in Chrome or Firefox
                 </p>
                 <p>
                   Currently, only Chrome and Firefox are supported.<br>
                   We use advanced WebGL rendering techniques that we cannot support<br> in other browsers due to limited time in life.
                 </p>
                 <input type="text" value="https://cutvid.io"></input>
                 <p style="font-size:10px;margin-top:0px;">Go ahead, copy paste in Chrome or Firefox!</p>
                 <p>
                   You can download Firefox at <a href="https://www.mozilla.org/en-CA/firefox/new/" target="_blank">mozilla.org</a>
                 </p>
                 <br><br>
                 <p style="font-size:11px;">
                   You can still try running cutvid.io at your own risk:
                   <a v-on:click="navigator_supported = true" style="color:#3af;cursor:pointer;">
                     try anyway
                   </a>
                 </p>
               </div>
             </div>`,
  methods: {
    api(){
      return window.API;
    },
    toggle_menu(menu_name){
      let menus = ["resources_menu_open", "file_menu_open", "project_menu_open", "edit_menu_open"];

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

    app.navigator_supported = true; // legacy
    // Now I just assume support

    fetch("settings.json").then((resp) => {
      resp.json().then((data) => {
        expose_settings(data);
        this.settings = data;
        // These are settings that never change during an apps
        // lifetime, so might as well set it globally
        window.lattefx_settings = data;
      });
    });

    this.sequencer = this.$refs["player"].$refs["sequencer"];
    this.player = this.$refs["player"];

    document.addEventListener("click", function(e){
      // https://gomakethings.com/detecting-clicks-outside-of-an-element-with-vanilla-javascript/
      // If we are clicking elsewhere, close that menu
      if (e.target.closest('.app-menu-links')) {
        return
      };

      this.resources_menu_open = false;
      this.file_menu_open = false;
      this.project_menu_open = false;
      this.edit_menu_open = false;
    }.bind(this));
  }
})
