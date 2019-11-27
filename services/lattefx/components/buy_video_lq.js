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
  <!-- hide for now
    <p class="goto-hq">
      Need more quality?
      <br>
      <a class="ui-button goto-hq-button"
         v-on:click="renderHQ"
         >
        <span class="ui-button-paypal-part">
          <img class="paypal-logo" src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png" alt="PayPal">
        </span>
        Render & Buy  US$ 2.50
      </a>
    </p>
  <p class="goto-hq-details">
    No frame drop<br>
    Accurate audio timing<br>
    Professionnal quality
  </p>
  -->
  <p class="thank-you">
    For any questions, comments, refunds, feedback on Lattefx, please contact
    {{email()}}<br>
    Help me improve this new product!
    <br><br>
    We would also like you to fill our survey to help improve Lattefx:
    <a href="https://docs.google.com/forms/d/e/1FAIpQLScb_mbpafTrCLf73RPhNlkVz3RUHK_k-4KUKa69RKKn8f4evQ/viewform?usp=sf_link"
       target="_blank">
      2 minutes Form
    </a>
    <br><br>
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

      this.$el.querySelectorAll("video")[0].addEventListener(
        "loadeddata",
        function(){
          this.previewReady = true;
        }.bind(this),
        {once: true}
      );

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
