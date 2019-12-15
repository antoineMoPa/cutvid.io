Vue.component('renders', {
  template:
  `<div class="renders popup">
     <h3>
       <img src="icons/feather-dark/image.svg" width="30"/>
       Renders
     </h3>
     <table class="table">
       <tr>
         <th class="text-left">
           Project name
         </th>
         <th>
           Status
         </th>
         <th>
           Storage
         </th>
         <th>
         </th>
       </tr>
       <tr v-for="render in renders" class="render">
         <td class="text-left">
           <span>{{render.name}}</span>
         </td>
         <td>
           <span>{{render.status}}</span>
         </td>
         <td>
           {{parseInt(render.bytecount / 1e6)}}MB
         </td>
         <td class="text-right">
           <a class="delete-render ui-button" v-if="render.status != 'rendering'" v-on:click="delete_render(render)">
             <img src="icons/feather/trash.svg" class="feather-button" width="24"/>
             Delete
           </a>
           <a class="ui-button" v-if="render.status == 'purchased'"
             v-on:click="download_video(render)">
             <img src="icons/feather/download.svg" class="feather-button" width="24"/>
             Download
           </a>
           <a class="ui-button" v-if="render.status == 'rendered'"
             v-on:click="buy_video(render)">
             <img src="icons/feather/dollar-sign.svg" class="feather-button" width="24"/>
             Buy
           </a>
         </td>
       </tr>
     </table>
     <div v-if="renders.length == 0">
       <p class="renders-no-render">You currently have no renders.<br/></p>
     </div>
     <div class="storage">
       <p>You have used <span class="percentage">{{used_percent}}%</span> of your storage on Lattefx cloud.</p>
       <div class="storage-indicator">
         <div class="storage-indicator-inner">
         </div>
       </div>
       <p>Used space: {{parseInt(used_bytes / 1e6)}}MB<br>
       Total space: {{parseInt(available_bytes / 1e6)}}MB</p>
       <p v-if="storage_full">
         You are above your storage limit.<br>
         We may remove your renders at any time.
       </p>
     </div>
   </div>`,
  data(){
    return {
      auth_url: "",
      user_info: null,
      renders: [],
      used_bytes: 0,
      available_bytes: 0,
      used_percent: 0,
      on_open_render: () => {},
      storage_full: false
    }
  },
  props: ["settings"],
  methods: {
    buy_video(render){
      render.status = "purchased";
    },
    async download_video(render){
      let auth = window.auth;
      let cloud_url = this.settings.cloud;

      if(typeof(auth) == "undefined"){
        return;
      }

      if(auth.user_info == null){
        auth.show_login();
      }

      let token = await auth.get_token();
      let url = this.settings.cloud + "/render/" + render.id;

      let req = await fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + token,
        }
      });
      let blob = await req.blob();
      let blob_url = window.URL.createObjectURL(blob);

      let a = document.createElement("a");
      a.href = blob_url;
      a.download = "video.avi";
      a.click();
    },
    async update_storage_info(token){
      let cloud_url = this.settings.cloud;
      let req = await fetch(cloud_url + "/get_storage_info", {
        headers: {
          'Authorization': 'Bearer ' + token,
        }
      });

      let resp = await req.json();

      this.used_percent = parseInt(resp.used_percent);
      this.available_bytes = resp.available_bytes;
      this.used_bytes = resp.used_bytes;

      // Update bar width
      let indicator_inner = this.$el.querySelectorAll(".storage-indicator-inner")[0];
      indicator_inner.style.width = Math.min(this.used_percent,100) + "%";

      if(this.used_percent){
        this.storage_full = true;
        indicator_inner.classList.add("pretty-full");
      } else {
        this.storage_full = false;
        indicator_inner.classList.remove("pretty-full");
      }
    },
    async fetch_renders(){
      let auth = window.auth;
      let cloud_url = this.settings.cloud;

      if(typeof(auth) == "undefined"){
        return;
      }

      if(auth.user_info == null){
        auth.show_login();
      }

      let token = await auth.get_token();
      let req = await fetch(cloud_url + "/list_renders", {
        headers: {
          'Authorization': 'Bearer ' + token,
        }
      });

      let renders = await req.json();

      for(let i in renders){
      }

      // It is probably a good time to update used storage
      // (but no need to await for this)
      this.update_storage_info(token);

      return renders;
    },
    delete_render(render){
      /* Ask for a confirmation to delete the render  */
      let app = this;
      let ask = new utils.ask_confirm();
      let container = document.createElement("div");
      document.body.appendChild(container);
      ask.$mount(container);

      ask.message = "Do you really want to delete '"+render.name+"'";
      ask.button_yes = "Delete render";
      ask.button_no = "No keep the render";
      ask.on_yes = () => {
        app.really_delete_render(render);
      };
      ask.on_no = () => {
        // Do nothing
      };
      ask.container_class = "render-confirm-delete";
    },
    async really_delete_render(render){
      let auth = window.auth;
      let cloud_url = this.settings.cloud;

      if(auth.user_info == null){
        auth.show_login();
        this.close();
        return;
      }

      let token = await auth.get_token();
      let req = await fetch(cloud_url + "/delete_render/" + render.id, {
        method: "DELETE",
        headers: {
          'Authorization': 'Bearer ' + token,
        }
      });

      // Update render list
      this.renders = await this.fetch_renders();
    }
  },
  watch: {
    async settings(){
      let app = this;
      this.renders = await this.fetch_renders();
    }
  },
  mounted() {
  }
});
