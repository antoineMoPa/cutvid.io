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
</div>
`,
  data: function(){
    return {

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
        fn: async function(blob, extension){
          return await this.show(blob, extension);
        }.bind(this),
        dev_only: true
      });
    },
    async show(blob){
      this.$el.classList.remove("hidden");
    },
  },
  watch: {
  },
  mounted(){
    let app = this;

    document.body.append(this.$el);

    let close_button = this.$el.querySelectorAll(".close-button")[0];
    let el = this.$el;

    close_button.addEventListener("click", function(){
      el.classList.add("hidden");
      window.player.player.rendering = false;
      let videos = el.querySelectorAll("video");
      if(videos.length > 0){
        videos[0].pause();
      }
      fetch("/stats/lattefx_app_hit_close/render_settings");
    });

    this.expose();
    window.addEventListener("message", this.onWindowMessage);
  }
});
