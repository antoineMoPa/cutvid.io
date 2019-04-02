Vue.component('buy-video', {
  template: `
<div class="popup buy-video hidden">
  <div class="close-button">
    <img src="icons/feather-dark/x.svg" width="40"/>
  </div>
  <h3>
    <img src="icons/feather-dark/download-cloud.svg" width="30"/>
    <span v-if="!canDownload">
      Buy video
    </span>
    <span v-else>
      Download video
    </span>
  </h3>
  <p v-if="videoID == null" class="loading-message">
    Your video is processing on our server.
     <img src="icons/feather-dark/loader.svg" width="30" class="loading-icon"/>
  </p>
  <p v-else class="loading-message">
    Your video is ready!
  </p>
  <div v-if="settings != undefined">
    <iframe v-bind:src="settings.auth + '/users/sign_in'"
            class="auth-iframe">
    </iframe>
    <p class="text-center" v-if="canDownload">
      <a class="ui-button large"
         v-bind:href="settings.downloadables_url + '/' + videoID + '/purchased-video-' +  videoID + '.avi'"
         v-bind:download="'purchased-video-' + videoID + '.avi'">
        Download Video
      </a>
    </p>
  </div>
</div>
`,
  props: ["settings"],
  data: function(){
    return {
      videoID: null,
      canDownload: false
    };
  },
  methods: {
    show(){
      this.$el.classList.remove("hidden");
    },
    setVideoID(_id){
      this.videoID = _id;
    },
    onWindowMessage(message){
      if(this.settings == null){
        return;
      }

      //if(message.origin == this.settings.auth){
        console.log(message.data);
        if(message.data == "user-is-signed-in"){
          this.canDownload = true;
        }
      //}
    }
  },
  mounted(){
    let app = this;

    document.body.append(this.$el);

    let close_button = this.$el.querySelectorAll(".close-button")[0];
    let el = this.$el;

    close_button.addEventListener("click", function(){
      el.classList.add("hidden");
      app.videoID = null;
    });

    window.addEventListener("message", this.onWindowMessage);
  }
});
