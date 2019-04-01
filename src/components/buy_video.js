Vue.component('buy-video', {
  template: `
<div class="popup buy-video">
  <div class="close-button">
    <img src="icons/feather-dark/x.svg" width="40"/>
  </div>
  <h3>
    <img src="icons/feather-dark/download-cloud.svg" width="30"/>
    Buy video
  </h3>
  {{ settings.downloadables_url + "/" +  videoID }}

</div>
`,
  props: ["videoID", "settings"],
  data: function(){
  },
  methods: {

  }
});
