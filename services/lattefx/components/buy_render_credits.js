Vue.component('buy-render-credits', {
  template: `
<div class="popup buy-render-credits hidden">
  <div class="close-button">
    <img src="icons/feather-dark/x.svg" width="40"/>
  </div>
  <h3>
    <img src="icons/feather-dark/image.svg" width="30"/>
    Buy Render Credits
  </h3>
  <div class="buy-credit-info">
    <h4>What is a render credit?</h4>
    <p>1 render credit allows you to render 1 video with a maximum duration of 5 minutes.</p>
    <div v-if="open_at_start" class="not-ready-to-buy">
      <h4>Not ready to buy?</h4>
      <p>
        You can create, edit and save projects after closing this popup.
        <br/>
        When you are ready to purchase a render,
        simply click the "Render Credits" purple button at the top right to open it back.
      </p>
    </div>
    <h4>Ready to buy?</h4>
    <p>We don't store nor handle any credit card details ourselves, we use PayPal as a secure payment provider.
      <br/>
      For any questions, problems, comments, refunds, feedback on cutvid.io, please contact the owner directly at
      <span class="owner-email">{{email()}}</span>
    </p>
  </div>
  <label class="product">
    <input type="radio" name="purchaseItem" value="1credit" v-model="purchaseItem">
    1 cutvid.io Render Credit - USD $ 1.50
  </label>
  <br/>
  <label class="product">
    <input type="radio" name="purchaseItem" value="2credits" v-model="purchaseItem">
    2 cutvid.io Render Credits - USD $ 2.50
  </label>
  <br/>
  <label class="product">
    <input type="radio" name="purchaseItem" value="5credits" v-model="purchaseItem">
    5 cutvid.io Render Credits - USD $ 4.50
  </label>
  <br/>
  <label class="product">
    <input type="radio" name="purchaseItem" value="premium" v-model="purchaseItem">
    1 Year Pro Subscription - USD $ 42.00<br/>
    <ul class="features-list">
      <li>
        Account topped up to 5 render credits per week.
      </li>
      <li>
        Up to 1GB project and render storage for 1 year.
      </li>
      <li>
        Cancel anytime.
      </li>
    </ul>
  </label>
  <p>
    Unused render credits stay in your account for as long as you don't use them.
  </p>
  <p>
    For pro subscriptions, your render credits are not accumulative. Render credits are filled to your weekly amount every week.
  </p>
  <br/>
  <div class="payment-container paypal-container">
    <!-- Paypal stuff goes here -->
  </div>
  <p v-if="purchased" class="thank-you">
    Thank you for your purchase!<br>
  </p>
</div>
`,
  data: function(){
    return {
      purchased: false,
      purchaseItem: null,
      open_at_start: false,
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
      // me to develop features & host Lattefx
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

          let product_price = {
            "1credit": {
              "description": "1 Render Credit",
              "value": "1.50"
            },
            "2credits": {
              "description": "2x Render Credits",
              "value": "2.50"
            },
            "5credits": {
              "description": "5x Render Credits",
              "value": "4.50"
            },
            "premium": {
              "description": "Premium Yearly Subscription",
              "value": "42.00"
            }
          };

          // Set up the transaction
          return actions.order.create({
            purchase_units: [{
              currency_code: "USD",
              description: product_price[app.purchaseItem]["description"],
              amount: {
                value: product_price[app.purchaseItem]["value"],
                breakdown: {
                  item_total: {
                    currency_code: "USD",
                    value: product_price[app.purchaseItem]["value"]
                  },
                }
              },
              items: [{
                name: product_price[app.purchaseItem]["description"],
                sku: app.purchaseItem,
                unit_amount: {
                  currency_code: "USD",
                  value: product_price[app.purchaseItem]["value"]
                },
                quantity: "1"
              }]
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
      let resp = await req.json();

      if(resp.success == true){
        this.$emit("bought");
        utils.flag_message(resp.message);
        this.$el.classList.add("hidden");
      } else {
        utils.real_bad_error("Error in payment. " + resp.message);
      }
    }
  },
  watch: {
    settings(){
      if(this.flow_started){
        return;
      }
      this.flow_started = true;

      let url = window.location.href;

      if(url.indexOf("?plan_") != -1){
        this.open_at_start = true;

        if(url.indexOf("plan_1credit") != -1){
          this.purchaseItem = "1credit";
          this.show();
        }
        if(url.indexOf("plan_2credits") != -1){
          this.purchaseItem = "2credits";
          this.show();
        }
        if(url.indexOf("plan_5credits") != -1){
          this.purchaseItem = "5credits";
          this.show();
        }
        if(url.indexOf("plan_premium") != -1){
          this.purchaseItem = "premium";
          this.show();
        }
      }
    }
  },
  mounted(){
    let app = this;
    this.flow_started = false;

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
