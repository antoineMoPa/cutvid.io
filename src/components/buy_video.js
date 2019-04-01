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
  <p v-if="videoID == null" class="loading-message">
    Your video is processing on our server.<br><br>
     <img src="icons/feather-dark/loader.svg" width="80" class="loading-icon"/>
  </p>
  <div v-else>
    <div v-if="settings != undefined">
      <h4>Your video is ready!</h4>
      <br>
      <p class="text-center">
        <a class="ui-button large"
           v-bind:href="settings.downloadables_url + '/purchased-video-' +  videoID + '.avi'"
           v-bind:download="'purchased-video-' + videoID + '.avi'">
          Download Video
        </a>
      </p>
      <br><br><br>
    </div>
  </div>
</div>
`,
  props: ["settings"],
  data: function(){
	return {
	  videoID: null
	};
  },
  methods: {
	show(){
	  this.$el.classList.remove("hidden");
	},
	setVideoID(_id){
	  this.videoID = _id;
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
  }
});
