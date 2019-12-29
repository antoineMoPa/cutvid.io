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

     <div class="header-auth-container">
       <!-- This gets moved in mounted() -->
       <p class="header-user-links">
         <span v-if="user_info != null">
           signed in as {{user_info.email_summary}}
         </span>
         <span v-if="user_info != null" class="render-credits-count"
           title="Number of render credits in your account | click to buy more"
           v-on:click="shop_render_credits"
         >
           Render credits: {{ user_info.render_credits }}
         </span>
         <a v-if="user_info != null" v-on:click="sign_out" class="sign-out">Sign out</a>
         <a v-else v-on:click="sign_in" class="sign-in">Sign in</a>
       </p>
     </div>
     <buy-render-credits ref="buy_render_credits"
                         v-on:bought="on_render_credits_bought"
                         v-bind:settings="settings"/>
   </div>`,
  data(){
    return {
      auth_url: "",
      user_info: null,
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
    async update_user_info(){
      this.user_info = await this.get_user_info();
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
    },
    async shop_render_credits(){
      this.$refs["buy_render_credits"].show();
    },
    on_render_credits_bought(){
      let app = this;
      this.get_user_info().then((result) => {
        app.user_info = result;
      });
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
    });

    window.auth = this; // This is in the limited globals approval list
  }
});
