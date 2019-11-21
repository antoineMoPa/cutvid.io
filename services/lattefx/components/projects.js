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
         <a class="delete-project" v-on:click="delete_project(project)">Delete</a>
       </div>
     </div>
     <div v-if="projects.length == 0">
       <p class="projects-no-project">You currently have no saved project.<br> Start one by clicking save progress next time you edit a video!</p>
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
    close(){
      this.$el.classList.add("hidden");
    },
    async fetch_projects(){
      let auth = window.auth;
      let renderer_url = this.settings.renderer;

      if(auth.user_info == null){
        auth.show_login();
        this.close();
        return;
      }

      let token = await auth.get_token();
      let req = await fetch(renderer_url + "/list_projects", {
        headers: {
          'Authorization': 'Bearer ' + token,
        }
      });

      return await req.json();
    },
    delete_project(project){
      /* Ask for a confirmation to delete the project  */
      let app = this;
      let ask = new utils.ask_confirm();
      let container = document.createElement("div");
      document.body.appendChild(container);
      ask.$mount(container);

      ask.message = "Do you really want to delete '"+project.name+"'";
      ask.button_yes = "Delete project";
      ask.button_no = "No keep the project";
      ask.on_yes = () => {
        app.really_delete_project(project);
      };
      ask.on_no = () => {
        // Do nothing
      };
      ask.container_class = "project-confirm-delete";
    },
    async really_delete_project(project){
      let auth = window.auth;
      let renderer_url = this.settings.renderer;

      if(auth.user_info == null){
        auth.show_login();
        this.close();
        return;
      }

      let token = await auth.get_token();
      let req = await fetch(renderer_url + "/delete_project/" + project.id, {
        method: "DELETE",
        headers: {
          'Authorization': 'Bearer ' + token,
        }
      });

      // Update project list
      this.projects = await this.fetch_projects();
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
