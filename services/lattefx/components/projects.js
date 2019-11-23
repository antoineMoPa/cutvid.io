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
       <a class="open-project">Open</a>
       <input v-model="project.name" type="text" class="project-name" v-on:keyup="begin_renaming(project)"/>&nbsp;
       <a v-if="project.renaming" v-on:click="rename_project(project)">Save</a>
       <div class="project-right">
         <a class="delete-project" v-on:click="delete_project(project)">Delete</a>
       </div>
     </div>
     <div v-if="projects.length == 0">
       <p class="projects-no-project">You currently have no saved project.<br> Start one by clicking save progress next time you edit a video!</p>
     </div>
     <div class="storage">
       <p>You have used <span class="percentage">{{used_percent}}%</span> of your storage on Lattefx cloud.</p>
       <div class="storage-indicator">
         <div class="storage-indicator-inner">
         </div>
       </div>
     </div>
   </div>`,
  data(){
    return {
      auth_url: "",
      user_info: null,
      projects: [],
      used_bytes: 0,
      available_bytes: 0,
      used_percent: 0
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
    async update_storage_info(token){
      let renderer_url = this.settings.renderer;
      let req = await fetch(renderer_url + "/get_storage_info", {
        headers: {
          'Authorization': 'Bearer ' + token,
        }
      });

      let resp = await req.json();

      this.used_percent = parseInt(resp.used_percent);

      // Update bar width
      let indicator_inner = this.$el.querySelectorAll(".storage-indicator-inner")[0];
      indicator_inner.style.width = this.used_percent + "%";

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

      let projects = await req.json();

      for(let i in projects){
        projects[i].renaming = false;
      }

      // It is probably a good time to update used storage
      // (but no need to await for this)
      this.update_storage_info(token);

      return projects;
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
    },
    async rename_project(project){
      project.renaming = false;

      let auth = window.auth;
      let renderer_url = this.settings.renderer;

      if(auth.user_info == null){
        auth.show_login();
        this.close();
        return;
      }

      let form = new FormData();
      form.append('name', project.name);

      let token = await auth.get_token();
      let req = await fetch(renderer_url + "/rename_project/" + project.id, {
        method: "POST",
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Encoding': 'multipart/form-data'
        },
        body: form
      });

      // Update project list
      this.projects = await this.fetch_projects();
    },
    begin_renaming(project){
      project.renaming = true;
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
