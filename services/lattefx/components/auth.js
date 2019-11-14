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
       <a v-if="logged_in" v-on:click="sign_out" class="sign-out">Sign out</a>
       <a v-else v-on:click="sign_in" class="sign-in">Sign in</a>
     </div>
   </div>`,
  data(){
    return {
      auth_url: "",
      logged_in: false
    }
  },
  props: ["settings"],
  methods: {
    async is_signed_in(){
      let auth_url = this.settings.auth;
      let resp = await fetch(auth_url + "/current_user");
      let json = await resp.json();

      if(json.status == "logged_out"){
        return false;
      } else {
        return true;
      }
    },
    show_login(){
      this.$el.classList.remove("hidden");
      let iframe = this.$el.querySelectorAll("iframe")[0];
      iframe.src = "/users/sign_in";
    },
    async save_video(){

      // Verify sign in as it could have timed out
      if(this.is_signed_in()){
        let data = JSON.stringify(window.player.serialize());
        var blob = new Blob([data], {type : 'text/json'});

        // TODO: save video
      } else {
        this.show_login();
      }
    },
    on_window_message(){
      let app = this;
      this.is_signed_in().then((result) => {
        app.logged_in = result;
      });
    },
    async sign_out(){
      let app = this;
      let auth_url = this.settings.auth;
      await fetch(auth_url + "/sign_out", {
        method: "DELETE"
      });
      this.is_signed_in().then((result) => {
        app.logged_in = result;
      });
    },
    sign_in(){
      this.show_login();
    }
  },
  watch: {
    settings(){
      let app = this;

      this.is_signed_in().then((result) => {
        app.logged_in = result;
      });
    },
    logged_in(){
      if(this.logged_in){
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
