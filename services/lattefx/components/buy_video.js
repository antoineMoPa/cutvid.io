Vue.component('buy-video', {
  template: `
<div class="popup buy-video hidden">
  <div class="close-button">
    <img src="icons/feather-dark/x.svg" width="40"/>
  </div>
  <h3>
    <img src="icons/feather-dark/download-cloud.svg" width="30"/>
    Buy video
  </h3>
  <p class="thank-you">
    Latte/<span title="High Quality">HQ</span> videos are USD $ 4.50 -
    Here is a 5 seconds preview:
    <br>
  </p>
  <div class="video-preview" v-on:contextmenu="onContextMenu">
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
      render: null,
      videoURL: null,
      previewURL: null,
      canDownload: false,
      error: null,
      stats: null,
      token: ""
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
    show(render, token){
      this.render = render;
      this.token = token;
      let vidid = render.id;

      this.$el.classList.remove("hidden");
      this.previewURL = window.lattefx_settings.cloud +
        "/render_preview/" + vidid + "/" + token;
      this.videoURL = window.lattefx_settings.cloud +
        "/render/" + vidid + "/" + token;

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
      let render_id = app.render.id;

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
            app.validate_purchase(render_id, details.id);
            fetch("/stats/lattefx_app_payment_approved/");
          });
        }
      }).render(paymentContainer);

      fetch("/stats/lattefx_app_paypal_init/");
    },
    async validate_purchase(render_id, order_id){
      let cloud_url = this.settings.cloud;
      let url = cloud_url + "/complete_purchase/" + render_id + "/" + order_id;
      let token = this.token;
      let req = await fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + token,
        }
      });

      let text = await req.text();

      if(text == "success"){
        this.canDownload = true;
        this.$emit("bought");
      } else {
        utils.real_bad_error("Error in payment.");
      }
    },
    setVideoID(_id){
      this.videoID = _id;
      this.loggedIn = false;
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
      el.querySelectorAll("video")[0].pause();
      fetch("/stats/lattefx_app_hit_close/");
    });

    window.addEventListener("message", this.onWindowMessage);
  }
});
