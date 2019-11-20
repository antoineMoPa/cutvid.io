Vue.component('projects', {
  template:
  `<div class="projects popup hidden">
     <div class="close-button">
       <img src="icons/feather-dark/x.svg" width="40"/>
     </div>
     <h3>
       <img src="icons/feather-dark/user.svg" width="30"/>
       Projects
     </h3>
     <div v-for="project in projects" class="project">
       <input v-bind:value="project.name" class="project-name"/>
       <div class="project-actions">
         <a class="open-project">Open</a>
         <a class="delete-project">Delete</a>
       </div>
     </div>
   </div>`,
  data(){
    return {
      auth_url: "",
      user_info: null,
      projects: []
    }
  },
  props: ["settings"],
  methods: {
    async open(){
      this.$el.classList.remove("hidden");
      this.projects = await this.fetch_projects();
    },
    async fetch_projects(){
      let auth = window.auth;
      let renderer_url = this.settings.renderer;

      if(auth.user_info == null){
        auth.show_login();
        return;
      }

      let token = await auth.get_token();
      let req = await fetch(renderer_url + "/list_projects", {
        headers: {
          'Authorization': 'Bearer ' + token,
        }
      });

      return await req.json();
    }
  },
  watch: {
    settings(){
      let app = this;
    }
  },
  mounted() {
    let close_button = this.$el.querySelectorAll(".close-button")[0];
    let el = this.$el;

    close_button.addEventListener("click", function(){
      el.classList.add("hidden");
    });
  }
});
