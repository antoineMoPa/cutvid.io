Vue.component('effects-selector', {
  template: `
<div class="popup effects-selector hidden">
  <div class="close-button">
    <img src="icons/feather-dark/x.svg" width="40"/>
  </div>
  <h3>
    <img src="icons/feather-dark/image.svg" width="30"/>
    Effects
  </h3>
  <div v-for="(effects, categoryName) in categories">
    <h4>{{ categoryName }}</h4>
    <a v-for="(content, effect) in effects" class="theme-box" v-on:click="chooseEffect(effect)">
      <img v-bind:src='"plugins/" + effect + "/preview.png"'/>
      <p class="effect-description">
       {{ content.description }}
      </p>
      <div class="new-item-indicator"
         v-if="is_date_new(content.date)"
         v-bind:title="content.date">
        New!
      </div>
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
    chooseEffect(effect){
      let effects_selector = this.$el;
      effects_selector.classList.add("hidden");
      if(this.callback != null){
        this.callback(effect);
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

	fetch("plugins_list.json?v=0.0.2").then(function(resp){
	  resp.json()
		.then(function(data){
		  app.categories = data;
		});
	});
  }
});
