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
     <div class="ui-auth-container">
       <a class="ui-button buy-button button-left-1 button-save"
         v-on:click="save_video">
       <img class="play-icon feather-button"
            src="icons/feather/save.svg"/>
         Save progress
       </a>
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
      user_info: null
    }
  },
  props: ["settings"],
  methods: {
    async get_user_info(){
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
      let iframe = this.$el.querySelectorAll("iframe")[0];
      iframe.src = "/users/sign_in";
    },
    async save_video(){
      let auth_url = this.settings.auth;
      let token = await (await fetch(auth_url + "/jwt_token")).text();

      // Verify sign in as it could have timed out
      if(this.get_user_info() != null){
        let renderer_url = this.settings.renderer;
        let data = window.player.serialize();
        let project_id = data.project_id;
        data = JSON.stringify(data);

        let form = new FormData();
        form.append('lattefx_file.lattefx', data);

        fetch(renderer_url + "/upload_project/" + project_id, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Encoding': 'multipart/form-data'
          },
          body: form
        });

        // TODO: save video
      } else {
        this.show_login();
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

      let save_button = document.querySelectorAll(".ui-auth-container")[0];
      let ui = document.querySelectorAll(".ui")[0];
      ui.appendChild(save_button);
    });
  }
});
