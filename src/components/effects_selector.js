Vue.component('effects-selector', {
  template: `
<div class="effects-selector hidden">
  <div class="close-button">
    <img src="icons/feather-dark/x.svg" width="40"/>
  </div>
  <h3>
  <img src="icons/feather-dark/image.svg" width="30"/>
  Effects
</h3>
  <a v-for="(content, effect) in effects" class="theme-box" v-on:click="chooseEffect(effect)">
    <img v-bind:src='"plugins/" + effect + "/preview.png"'/>
    <p class="effect-description">
     {{ content.description }}
    </p>
  </a>
  <br><br>
</div>`,
  data(){
    return {
      effects: {},
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
	
	
	fetch("plugins_list.json").then(function(resp){
	  resp.json()
		.then(function(data){
		  app.effects = data;
		});
	});
  }
});

  
