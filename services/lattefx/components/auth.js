/*
   Auth manages all access to the auth codebase
*/

Vue.component('auth', {
  template:
  `<div class="auth popup hidden">
     <div class="close-button">
       <img src="icons/feather-dark/x.svg" width="40"/>
     </div>
     <h3>
       <img src="icons/feather-dark/user.svg" width="30"/>
       Lattefx cloud
     </h3>
     <iframe class="auth-iframe"></iframe>
     <div v-bind:class="class_name"
          v-for="class_name in ['ui-auth-container', 'props-auth-container']">
       <!-- We repeat this node 2 times because we'll
            place it in many places to encourage saving
            and logging in -->
       <a class="ui-button button-left-1 button-save"
         v-if="!saving"
         v-on:click="save_video">
         <img class="play-icon feather-button"
              v-if="show_saved_message"
              src="icons/feather/check.svg"/>
         <img class="play-icon feather-button"
              v-else-if="user_info != null"
              src="icons/feather/save.svg"/>
         <img class="play-icon feather-button"
              v-else
              src="icons/feather/user.svg"/>
         <span v-if="show_saved_message">
           Saved!
         </span>
         <span v-else-if="user_info != null">
           Save progress
         </span>
         <span v-else>
           Sign in
         </span>
       </a>
       <button v-else class="ui-button saving-video">
         Saving video...
       </button>
     </div>
     <div class="header-auth-container">
       <!-- This gets moved in mounted() -->
       <p class="header-user-links">
         <span v-if="user_info != null">
           signed in as {{user_info.email_summary}}
         </span>
         <a v-if="user_info != null" v-on:click="sign_out" class="sign-out">Sign out</a>
         <a v-else v-on:click="sign_in" class="sign-in">Sign in</a>
       </p>
     </div>
   </div>`,
  data(){
    return {
      auth_url: "",
      user_info: null,
      saving: false,
      show_saved_message: false
    }
  },
  props: ["settings"],
  methods: {
    async get_user_info(){
      if(this.settings == null){
        return;
      }
      let auth_url = this.settings.auth;
      let resp = await fetch(auth_url + "/current_user");
      let json = await resp.json();

      if(json.status == "logged_out"){
        return null;
      } else {
        return json;
      }
    },
    show_login(){
      this.$el.classList.remove("hidden");
      let auth_url = this.settings.auth;
      let iframe = this.$el.querySelectorAll("iframe")[0];
      iframe.src = auth_url + "/users/sign_in";
    },
    async get_token(){
      let auth_url = this.settings.auth;
      let token = await (await fetch(auth_url + "/jwt_token")).text();

      return token
    },
    async save_video(){
      let app = this;
      let auth_url = this.settings.auth;
      let token = await this.get_token();

      app.saving = true;

      await this.$nextTick();
      this.user_info = await this.get_user_info();
      // Verify sign in as it could have timed out
      if(this.user_info == null){
        this.show_login();
        app.saving = false;
      } else{
        let cloud_url = this.settings.cloud;
        let data = window.player.serialize();
        let project_id = data.project_id;

        // New project - get a new project id
        if(project_id == null){
          let req = await fetch(cloud_url + "/get_a_new_project_id", {
            headers: {
              'Authorization': 'Bearer ' + token,
            }
          });
          project_id = await req.text();
          window.player.project_id = project_id;
        }

        data = JSON.stringify(data);

        let form = new FormData();
        form.append('lattefx_file.lattefx', data);

        fetch(cloud_url + "/upload_project/" + project_id, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Encoding': 'multipart/form-data'
          },
          body: form
        }).then(() => {
          app.saving = false;
          app.show_saved_message = true;
          setTimeout(()=>{
            app.show_saved_message = false;
          }, 2000);
        });
      }
    },
    on_window_message(){
      let app = this;
      this.get_user_info().then((result) => {
        app.user_info = result;
      });
    },
    async sign_out(){
      let app = this;
      let auth_url = this.settings.auth;
      await fetch(auth_url + "/sign_out", {
        method: "DELETE"
      });
      this.get_user_info().then((result) => {
        app.user_info = result;
      });
    },
    sign_in(){
      this.show_login();
    }
  },
  watch: {
    settings(){
      let app = this;

      this.get_user_info().then((result) => {
        app.user_info = result;
      });
    },
    user_info(){
      if(this.user_info != null){
        this.$el.classList.add("hidden");
      }
    }
  },
  mounted() {
    let close_button = this.$el.querySelectorAll(".close-button")[0];
    let el = this.$el;

    close_button.addEventListener("click", function(){
      el.classList.add("hidden");
    });

    window.addEventListener("message", this.on_window_message.bind(this));

    this.$nextTick(() => {
      // Move sign in/out buttons to their place
      let sign_in_out = document.querySelectorAll(".header-auth-container")[0];
      let header = document.querySelectorAll("header")[0];
      header.appendChild(sign_in_out);

      let container = document.querySelectorAll(".ui-auth-container");

      if(container.length != 0){
        // We are in "renders" app, not in player
        // We are in "renders" app
        container = container[0];
        let ui = document.querySelectorAll(".ui .ui-buttons-right")[0];
        ui.appendChild(container);

        let container_for_props = this.$el.querySelectorAll(".props-auth-container")[0];
        let props = document.querySelectorAll(".props-auth-placeholder")[0];
        props.appendChild(container_for_props);
      } else {
        return;
      }
    });

    window.auth = this; // This is in the limited globals approval list
  }
});
