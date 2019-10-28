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
  <p v-if="!canDownload" class="thank-you">
    Latte/<span title="High Quality">HQ</span> videos are USD $ 4.50
    <br>
  </p>
  <div v-if="!canDownload" class="video-preview" v-on:contextmenu="onContextMenu">
    <p v-if="!previewReady">We are building a 5 seconds preview...</p>
    <p v-else>Here is a 5 seconds preview:</p>
    <video v-bind:src="previewURL" controls></video>
  </div>
  <div class="payment-container" v-if="!canDownload">
    <!-- Paypal stuff goes here -->
  </div>
  <p v-if="canDownload" class="thank-you">
    Thank you for your purchase!<br>
    Use this button to save your video.<br>
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
  <p class="thank-you">
    For any questions, comments, refunds, feedback on Lattefx, please contact
    {{email()}}<br>
    Help me improve this new product!
    <br><br>
  </p>
</div>
`,
  data: function(){
    return {
      videoURL: null,
      previewURL: null,
      canDownload: false,
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
    show(vidid){
      this.$el.classList.remove("hidden");
      this.previewReady = false;
      this.previewURL = window.lattefx_settings.renderer +
        "/rendered_video_preview/" +
        vidid;
      this.videoURL = window.lattefx_settings.renderer +
        "/rendered_video/" + vidid + "/lattefx-hq-video.avi";

      this.$el.querySelectorAll("video")[0].addEventListener(
        "loadeddata",
        function(){
          this.previewReady = true;
        }.bind(this),
        {once: true}
      );

      let client_id = this.settings.paypal_client_id;
      let script = document.createElement("script");
      script.type = "text/javascript";
      script.onload = this.initPaypal;
      script.src = "https://www.paypal.com/sdk/js?client-id="+client_id;
      document.head.appendChild(script);
    },
    initPaypal(){
      let app = this;
      let paymentContainer = this.$el.querySelectorAll(".payment-container")[0];
      paypal.Buttons({
        createOrder: function(data, actions) {
          // Set up the transaction
          return actions.order.create({
            purchase_units: [{
              currency_code: "USD",
              description: "Video - web render",
              amount: {
                value: "4.50"
              }
            }]
          });
          fetch("/stats/lattefx_app_paypal_order_created/");
        },
        onApprove: function(data, actions) {
          return actions.order.capture().then(function(details) {
            fetch("/stats/lattefx_app_payment_done/");
            app.canDownload = true;

            // Temporary freebie
            window.localStorage.last_buy = new Date();
          });
        }
      }).render(paymentContainer);

      fetch("/stats/lattefx_app_paypal_init/");
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
      fetch("/stats/lattefx_app_hit_close/");
    });

    window.addEventListener("message", this.onWindowMessage);
  }
});
