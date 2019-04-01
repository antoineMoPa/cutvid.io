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
  <div v-if="settings != undefined">
    {{ settings.downloadables_url + "/" +  videoID }}
  </div>
</div>
`,
  props: ["videoID", "settings"],
  data: function(){
	return {
	  
	};
  },
  methods: {
	show(){
	  this.$el.classList.remove("hidden");
	}
  },
  mounted(){
	let app = this;

    document.body.append(this.$el);
	
    let close_button = this.$el.querySelectorAll(".close-button")[0];
    let el = this.$el;
	
    close_button.addEventListener("click", function(){
      el.classList.add("hidden");
    });
  }
});
