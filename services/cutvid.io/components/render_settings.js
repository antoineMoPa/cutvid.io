Vue.component('render-settings', {
  template: `
<div class="popup render-settings hidden">
  <div class="close-button">
    <img src="icons/feather-dark/x.svg" width="40"/>
  </div>
  <h3>
    <img src="icons/feather-dark/download-cloud.svg" width="30"/>
    Render Settings
  </h3>
  <div>
  <h4>File type</h4>
  <label>
    <input type="radio" value="mp4" v-model="export_file_type">
    MP4 <span class="file-type-detail">(video)</span>
  </label>
  <br/>
  <label>
    <input type="radio" value="gif" v-model="export_file_type">
    GIF <span class="file-type-detail">(animated image with no sound)</span>
  </label>
  <br/><br/>
  <div class="text-right">
    <button class="ui-button render-button" v-on:click="render">Render</button>
  </div>
  <br/>
  </div>
</div>
`,
  data: function(){
    return {
      export_file_type: "mp4",
      resolve: function(){},
      reject: function(){}
    };
  },
  props: ["settings", "user_info"],
  methods: {
    expose(){
      window.API.expose({
        name: "render_settings.show",
        doc: `Show Render Setting UI

        This async function returns the render settings.
        `,
        fn: async function(){
          return await this.show();
        }.bind(this),
        dev_only: true
      });
    },
    async show(){
      this.$el.classList.remove("hidden");

      return new Promise(function(resolve, reject){
        this.resolve = resolve;
        this.reject = reject;
      }.bind(this));
    },
    render(){
      this.$el.classList.add("hidden");
      this.resolve({
        export_file_type: this.export_file_type
      });
    }
  },
  watch: {
  },
  mounted(){
    let app = this;

    document.body.append(this.$el);

    let close_button = this.$el.querySelectorAll(".close-button")[0];
    let el = this.$el;

    close_button.addEventListener("click", function(){
      this.reject();
      el.classList.add("hidden");
      window.player.player.rendering = false;
      let videos = el.querySelectorAll("video");
      if(videos.length > 0){
        utils.safe_pause(videos[0]);
      }
      fetch("/stats/cutvid_app_hit_close/render_settings");
    }.bind(this));

    this.expose();
    window.addEventListener("message", this.onWindowMessage);
  }
});
