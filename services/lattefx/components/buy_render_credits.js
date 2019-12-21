Vue.component('buy-render-credits', {
  template: `
<div class="popup buy-render-credits hidden">
  <div class="close-button">
    <img src="icons/feather-dark/x.svg" width="40"/>
  </div>
  <h3>
    <img src="icons/feather-dark/image.svg" width="30"/>
    Buy render credits
  </h3>
  <p class="product has-new-item">
    5 Lattefx render credits - USD $ 4.50
    <span class="new-item-indicator">NEW</span>
  </p>
  <p>
    Unused render credits stay in your account for as long as you don't use them.
  </p>
  <br/>
  <div class="payment-container">
    <!-- Paypal stuff goes here -->
  </div>
  <p v-if="purchased" class="thank-you">
    Thank you for your purchase!<br>
  </p>
  <p class="thank-you">
    For any questions, comments, refunds, feedback on Lattefx, please contact the owner directly at
    <span class="owner-email">{{email()}}</span><br>
    <br>
  </p>
</div>
`,
  data: function(){
    return {
      purchased: false,
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
    show(){
      this.$el.classList.remove("hidden");
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
              description: "5x Render Credits",
              amount: {
                value: "4.50"
              }
            }]
          });
          fetch("/stats/lattefx_app_paypal_order_created/");
        },
        onApprove: function(data, actions) {
          return actions.order.capture().then(function(details) {
            app.validate_purchase(details.id);
            fetch("/stats/lattefx_app_payment_approved/");
          });
        }
      }).render(paymentContainer);

      fetch("/stats/lattefx_app_paypal_init/");
    },
    async validate_purchase(order_id){
      let auth_url = this.settings.auth;
      let url = auth_url + "/validate_render_credit_order/" + order_id;
      let req = await fetch(url);
      let text = await req.text();

      if(text == "success"){
        this.$emit("bought");
        utils.flag_message("You have purchased 5 render credits!");
        this.$el.classList.add("hidden");
      } else {
        utils.real_bad_error("Error in payment.");
      }
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
      fetch("/stats/lattefx_render_credits_hit_close/");
    });

    window.addEventListener("message", this.onWindowMessage);
  }
});
