Vue.component('scene-template-selector', {
  template: `
<div class="popup scene-template-selector hidden">
  <div class="close-button">
    <img src="icons/feather-dark/x.svg" width="40"/>
  </div>
  <h3>
    <img src="icons/feather-dark/image.svg" width="30"/>
    Scene templates
  </h3>
  <div v-for="(templates, categoryName) in categories">
    <h4>{{ categoryName }}</h4>
    <a v-for="(content, template) in templates" class="theme-box" v-on:click="chooseTemplate(template)">
      <video controls loop
             v-bind:poster='"scene_templates/" + template + "/preview.png"'>
        <source type="video/webm"
                v-bind:src='"scene_templates/" + template + "/preview.webm"'/>
        <source type="video/mp4"
                v-bind:src='"scene_templates/" + template + "/preview.mp4"'/>
      </video>

      <p class="template-description">
       {{ content.description }}
      </p>
    </a>
    <br><br>
  </div>
</div>`,
  data(){
    return {
      categories: {},
    };
  },
  methods: {
    chooseTemplate(template){
      let templates_selector = this.$el;
      templates_selector.classList.add("hidden");
      if(this.callback != null){
        let callback = this.callback;

        fetch('scene_templates/'+template+'/scenes.json?' + Math.random())
          .then((data) => {
            data.json().then((data) => {
              callback(data.scenes);
            });
          });
      }
    },
    open(callback) {
      this.callback = callback;
      this.$el.classList.toggle("hidden");
    }
  },
  mounted(){
    let app = this;

    this.callback = null;
    document.body.append(this.$el);
    let close_button = this.$el.querySelectorAll(".close-button")[0];
    let el = this.$el;
    close_button.addEventListener("click", function(){
      el.classList.add("hidden");
    });

    fetch("scene_templates_list.json").then(function(resp){
      resp.json()
        .then(function(data){
          app.categories = data;
        });
    });
  }
});
