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
  <p v-if="videoID != null && !loggedIn" class="how-to-download-info">
    Log in to use your seconds or purchase the video to download.
  </p>
  <div v-if="settings != undefined">
    <iframe v-bind:src="settings.auth + '/users/sign_in'"
            v-if="!loggedIn"
            class="auth-iframe">
    </iframe>
    <p v-if="canDownload" class="thank-you">
      Thank you for your purchase!
    </p>
    <p v-if="stats != null" class="account-info">
      For this video, <span class="number">{{stats.seconds_consumed}}</span> seconds were taken from your account.<br>
      You have <span class="number">{{stats.seconds_left}}</span> seconds left until the end of your billing cycle.<br><br>
    </p>
    <p class="text-center" v-if="canDownload">
      <a class="ui-button large"
         v-bind:href="settings.downloadables_url + '/' + videoID + '/purchased-video-' +  videoID + '.avi'"
         v-bind:download="'purchased-video-' + videoID + '.avi'">
        Download Video
      </a>
      <br><br>
    </p>
  </div>
</div>
`,
  props: ["settings"],
  data: function(){
    return {
      videoID: null,
      canDownload: false,
      loggedIn: false,
      stats: null
    };
  },
  methods: {
    show(){
      this.$el.classList.remove("hidden");
    },
    setVideoID(_id){
      this.videoID = _id;
      this.loggedIn = false;
      this.canDownload = false;
    },
    onWindowMessage(message){
      let app = this;
      if(this.settings == null){
        return;
      }

      if(message.origin == this.settings.auth){
        if(message.data == "user-is-signed-in"){
          app.loggedIn = true;
          this.consume();
        }
      }
    },
    consume(){
      let app = this;

      if(this.videoID == null || this.loggedIn == false){
        // Wait for logging or video id
        return;
      }

      fetch(app.settings.auth + "/consume/" + this.videoID, {
        mode: 'cors',
        method: 'POST',
        credentials: 'include',
      }).then((resp) => {
        resp.json().then((data) => {
          if(data.success != undefined && data.success == "video-purchased"){
            app.canDownload = true;
            app.stats = data;
          }
        });
      });
    }
  },
  watch: {
    videoID(){
      this.consume();
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
