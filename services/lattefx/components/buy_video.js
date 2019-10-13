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
  <div class="payment-container" v-if="!canDownload">
    <!-- Paypal stuff goes here -->
  </div>
  <p v-if="canDownload" class="thank-you">
    Thank you for your purchase!<br>
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
  <p v-if="weGaveYouSomeTime" class="thank-you">
    By the way, we just gave you 1 extra hour to make extra edits and download again. Simply click "buy now" and the download button will be available for this duration!
  </p>
</div>
`,
  data: function(){
    return {
      videoURL: null,
      canDownload: false,
      error: null,
      stats: null,
      weGaveYouSomeTime: false
    };
  },
  props: ["settings"],
  methods: {
    show(blob){
      this.videoURL = URL.createObjectURL(blob);
      this.$el.classList.remove("hidden");

      // Temporary freebie
      let last_buy = new Date(window.localStorage.last_buy);
      let can_buy_until = last_buy;
      // Leave 1.1 hours to have some buffer
      can_buy_until.setTime(can_buy_until.getTime() + parseInt(1.1*60*60*1000))

      if(can_buy_until > new Date()){
        fetch("/stats/lattefx_app_1_hour_freebie_download");
        this.canDownload = true;
        return;
      }

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
      fetch("/stats/lattefx_app_paypal_init");
      paypal.Buttons({
        createOrder: function(data, actions) {
          // Set up the transaction
          return actions.order.create({
            purchase_units: [{
              currency_code: "USD",
              description: "Video - web render",
              amount: {
                value: "3.50"
              }
            }]
          })
        },
        onApprove: function(data, actions) {
          return actions.order.capture().then(function(details) {
            fetch("/stats/lattefx_app_payment_done");
            app.canDownload = true;

            // Temporary freebie
            window.localStorage.last_buy = new Date();
            app.weGaveYouSomeTime = true;
          });
        }
      }).render(paymentContainer);
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
      app.weGaveYouSomeTime = false;
    });

    window.addEventListener("message", this.onWindowMessage);
  }
});
