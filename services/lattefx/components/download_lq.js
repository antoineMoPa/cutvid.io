Vue.component('download-lq', {
  template: `
<div class="popup download-video hidden">
  <div class="close-button">
    <img src="icons/feather-dark/x.svg" width="40"/>
  </div>
  <h3>
    Download
  </h3>
  <div class="video-preview">
    <video v-bind:src="videoURL" controls></video>
    <p class="thank-you">
      Thank you for using LatteFx!<br>
    </p>
  </div>
  <p class="text-center">
    <a class="ui-button large"
       v-bind:href="videoURL"
       v-bind:download="'lattefx-free-lq-video-'+videoTimeStamp()+'.avi'">
      Download Video
    </a>
    <br><br>
  </p>
  <p class="goto-hq">
    Need more quality?
    <br>
    <a class="ui-button goto-hq-button"
       v-on:click="renderHQ"
       >
      <span class="ui-button-paypal-part">
        <img class="paypal-logo" src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png" alt="PayPal">
      </span>
      Render & Buy  US$ 7.50
    </a>
  </p>
  <p class="goto-hq-details">
    No frame drop<br>
    Accurate audio timing<br>
    Professionnal quality
  </p>
  <p class="thank-you">
    For any questions, comments, feedback on Lattefx, please contact
    {{email()}}<br>
    Help me improve this new product!
    <br><br>
  </p>
</div>
`,
  data: function(){
    return {
      videoURL: null,
      error: null,
      stats: null
    };
  },
  props: ["settings"],
  methods: {
    renderHQ(){
      this.$emit("renderHQ");
      this.close();
    },
    email(){
      let name = "antoine.morin.paulhus";
      let at = "@";
      let host = "g" + "ma" + "il" + "." + "com";
      return name + at + host;
    },
    show(blob){
      this.videoURL = URL.createObjectURL(blob);
      this.$el.classList.remove("hidden");
    },
    videoTimeStamp(){
      let date = new Date();
      let date_string = date.toLocaleString();

      return date_string.replace(/[^0-9-A-Za-z]+/g,"-");
    },
    close(){
      this.$el.classList.add("hidden");
      this.$el.querySelectorAll("video")[0].pause();
      fetch("/stats/lattefx_app_hit_close/");
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
      app.close();
    });

    window.addEventListener("message", this.onWindowMessage);
  }
});
