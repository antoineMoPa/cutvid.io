Vue.component('buy-video', {
  template: `
<div class="popup download-video hidden">
  <div class="close-button">
    <img src="icons/feather-dark/x.svg" width="40"/>
  </div>
  <h3>
    Download
  </h3>
  <video v-bind:src="videoURL" controls></video>
  <p v-if="canDownload" class="thank-you">
    Thank you for using LatteFx!<br>
  </p>
  <p class="text-center" v-if="canDownload">
    <a class="ui-button large"
       v-bind:href="videoURL"
       v-bind:download="'lattefx-purchased-video-'+videoTimeStamp()+'.avi'">
      Download Video
    </a>
    <br><br>
  </p>
  <p class="thank-you">
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
    show(blob){
      this.videoURL = URL.createObjectURL(blob);
      this.$el.classList.remove("hidden");
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
      fetch("/stats/lattefx_app_hit_close/");
    });

    window.addEventListener("message", this.onWindowMessage);
  }
});
