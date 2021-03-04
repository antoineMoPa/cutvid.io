Vue.component('download-video', {
  template: `
<div class="popup download-video hidden">
  <div class="close-button">
    <img src="icons/feather-dark/x.svg" width="40"/>
  </div>
  <h3>
    <img src="icons/feather-dark/download-cloud.svg" width="30"/>
    <span v-if="!canDownload">
      Download video
    </span>
    <span v-else>
      Download video
    </span>
  </h3>
  <div v-if="!canDownload" class="video-preview">
    <video v-bind:src="previewURL" controls></video>
  </div>
  <div class="payment-container" v-if="!canDownload">
    <!-- Paypal stuff goes here -->
  </div>
  <p v-if="canDownload" class="thank-you">
    Thank you for using cutvid.io!<br><br>
    You can now save and share your video:<br>
  </p>
  <p class="text-center" v-if="canDownload">
    <a class="ui-button"
       v-bind:href="videoURL"
       v-bind:download="'cutvid-io-'+videoTimeStamp()+'.'+file_extension">
      <img src="icons/feather/download.svg" width="25"
           style="position:relative;top: 6px;"/>
      Download<span v-if="file_extension == 'gif'"></span>
              <span v-else>Video</span>
    </a>
    <a class="ui-button"
       v-if="user_info != null && shared_video_id == null && !uploading"
       v-on:click="share_video">
      <img src="icons/feather/link.svg" width="25"
           style="position:relative;top: 6px;"/>
      Share Video*
    </a>
    <span v-else-if="shared_video_id == null" style="margin-left:30px;">
      Sign in to share video
    </span>
    <span v-if="uploading" style="margin-left:20px;">Uploading video</span>
    <br><br>
    <div v-if="file_extension == 'gif'" class="text-center">
      <img v-bind:src="videoURL"/>
    </div>
    <div v-else>
      <video v-bind:src="videoURL" controls></video>
    </div>
    <br>
  </p>
  <div class="text-center" v-if="shared_video_url != null">
    <p>Copy/paste this link to share your video:</p>
    <input type="text"
           size="50"
           v-model="shared_video_url"
           class="text-center" readonly><br>
    <p style="font-size:14px;">
      Warning: Anyone with this link can view the video.
    </p>
  </div>
</div>
`,
  data: function(){
    return {
      videoURL: null,
      previewURL: null,
      video_blob: null,
      canDownload: true,
      previewReady: false,
      shared_video_id: null,
      shared_video_url: null,
      uploading: false,
      file_extension: "",
      error: null,
      stats: null
    };
  },
  props: ["settings", "user_info"],
  methods: {
    expose(){

      window.API.expose({
        name: "download.show",
        doc: `Show a Download UI for a video

        `,
        fn: function(blob, extension){
          this.show(blob, extension);
        }.bind(this),
        no_ui: true
      });

      window.API.expose({
        name: "download.hot_reload",
        doc: `Hot Reload Download UI for a video

        `,
        fn: async function(){
          await utils.load_script("components/download_video.js?" + Math.random());
          let blob = this.video_blob;
          await this.$parent.$forceUpdate();
          window.API.call("download.show", blob);
        }.bind(this),
        no_ui: true,
        dev_only: true
      });
    },
    email(){
      let name = "antoine.morin.paulhus";
      let at = "@";
      let host = "g" + "ma" + "il" + "." + "com";
      return name + at + host;
    },
    show(blob, extension){
      this.file_extension = extension || "avi";
      this.$el.classList.remove("hidden");
      let url = "";

      url = URL.createObjectURL(blob);

      this.previewReady = false;
      this.previewURL = url;
      this.videoURL = url;
      this.video_blob = blob;

      let videos = this.$el.querySelectorAll("video");
      if(videos.length > 0){
        videos[0].addEventListener(
          "loadeddata",
          function(){
            this.previewReady = true;
          }.bind(this),
          {once: true}
        );
      }
    },
    setVideoID(_id){
      this.videoID = _id;
      this.canDownload = false;
      this.shared_video_url = null;
      this.shared_video_id = null;
      this.uploading = false;
    },
    videoTimeStamp(){
      let date = new Date();
      let date_string = date.toLocaleString();

      return date_string.replace(/[^0-9-A-Za-z]+/g,"-");
    },
    async share_video(){
      if(this.user_info == null){
        return;
      }

      this.uploading = true;

      let form = new FormData();
      form.append('video.video', new File([this.video_blob], "video.video"));

      let token = await auth.get_token();

      let cloud_url = this.settings.cloud;
      let req = await fetch(cloud_url + "/upload_shared_video/", {
        method: "POST",
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Encoding': 'multipart/form-data'
        },
        body: form
      });

      let json = await req.json();

      if(json.success == true){
        this.shared_video_id = json.video_id;
        let url = "";

        // Faster than checking settings
        if(window.location.href.indexOf("127.0.0.1") != -1){
          url = this.settings.app.replace("/app/","") +
            "/landing/share/?" +
            json.user_id + "-" +
            json.video_id;
        } else {
          url = this.settings.app.replace("/app","") +
            "/share/?" +
            json.user_id + "-" +
            json.video_id;
        }

        this.shared_video_url = url;
      }
      this.uploading = false;
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
      let videos = el.querySelectorAll("video");
      if(videos.length > 0){
        videos[0].pause();
      }
      fetch("/stats/lattefx_app_hit_close/");
    });

    this.expose();
    window.addEventListener("message", this.onWindowMessage);
  }
});
