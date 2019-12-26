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
    <br>
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
        <button class="ui-button lfx-button">
          Use!
        </button>
        <div class="new-item-indicator"
             v-if="is_date_new(content.date)"
             v-bind:title="content.date">
          New!
        </div>
      </p>
    </a>
    <br><br>
  </div>
  <br>
</div>`,
  data(){
    return {
      categories: {},
    };
  },
  methods: {
    async chooseTemplate(template){
      let templates_selector = this.$el;
      templates_selector.classList.add("hidden");
      if(this.callback != null){
        let callback = this.callback;

        this.$emit("start_loading");

        await this.$nextTick();

        fetch('scene_templates/'+template+'/template.lattefx?' + Math.random())
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
    },
    is_date_new(_date){
      let date = new Date(_date).getTime();
      let now = new Date().getTime()
      let new_threshold = 60*60*1000*7*2*24; // 2 Week

      if(now - date < new_threshold){
        return true;
      }

      return false;
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
