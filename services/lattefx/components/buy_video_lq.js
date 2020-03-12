Vue.component('buy-video-lq', {
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
  <p v-if="!canDownload" class="thank-you">
    Espresso/<span title="low quality">LQ</span> videos are USD $ 2.50
    <br>
  </p>
  <div v-if="!canDownload" class="video-preview" v-on:contextmenu="onContextMenu">
    <video v-bind:src="previewURL" controls></video>
  </div>
  <div class="payment-container" v-if="!canDownload">
    <!-- Paypal stuff goes here -->
  </div>
  <p v-if="canDownload" class="thank-you">
    Thank you for using Lattefx!<br><br>
    Click this button to save your video.<br>
  </p>
  <p class="text-center" v-if="canDownload">
    <a class="ui-button large"
       v-bind:href="videoURL"
       v-bind:download="'lattefx-purchased-video-'+videoTimeStamp()+'.avi'">
      Download Video
    </a>
    <br><br>
  </p>
  <p v-if="canDownload" class="thank-you">
    See you soon!<br><br>
  </p>
</div>
`,
  data: function(){
    return {
      videoURL: null,
      previewURL: null,
      canDownload: true,
      previewReady: false,
      error: null,
      stats: null
    };
  },
  props: ["settings"],
  methods: {
    email(){
      let name = "antoine.morin.paulhus";
      let at = "@";
      let host = "g" + "ma" + "il" + "." + "com";
      return name + at + host;
    },
    onContextMenu(){
      // If you know how to remove this,
      // maybe you deserve your download
      // But keep in mind that paying allows
      // me to develop features & host LatteFx
      // You can also pay me by suggesting features
      // And improvement at my email address!
      return false;
    },
    show(blob){
      this.$el.classList.remove("hidden");
      let url = URL.createObjectURL(blob);
      this.previewReady = false;
      this.previewURL = url;
      this.videoURL = url;

      let videos = this.$el.querySelectorAll("video");
      if(videos.length > 0){
        videos[0].addEventListener(
          "loadeddata",
          function(){
            this.previewReady = true;
          }.bind(this),
          {once: true}
        );
      }
    },
    setVideoID(_id){
      this.videoID = _id;
      this.loggedIn = false;
      this.canDownload = false;
    },
    videoTimeStamp(){
      let date = new Date();
      let date_string = date.toLocaleString();

      return date_string.replace(/[^0-9-A-Za-z]+/g,"-");
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
      el.classList.add("hidden");
      window.player.player.rendering = false;
      let videos = el.querySelectorAll("video");
      if(videos.length > 0){
        videos[0].pause();
      }
      fetch("/stats/lattefx_app_hit_close/");
    });

    window.addEventListener("message", this.onWindowMessage);
  }
});
