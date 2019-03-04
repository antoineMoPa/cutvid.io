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
    <br>
    <p class="effect-description">
     {{ content.description }}
    </p>
  </a>
</div>`,
  data(){
    return {
      effects: {
        "textLayer": {
          "description": "Adds the text to the canvas."
        },
        "vignette": {
          "description": "Creates darker corners at the edges of the canvas."
        },
        "retrowave": {
          "description": "Retro nostalgia poster effect."
        },
        "epicSunset": {
          "description": "A retro sunset."
        },
        "edgeDetect": {
          "description": "Edge detection effect."
        },
        "backgroundColor": {
          "description": "Replaces transparent parts with a uniform color."
        },
		"logoReveal": {
          "description": "Makes your logo appear with nice effects."
        },
      },
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
    this.callback = null;
    document.body.append(this.$el);
    let close_button = this.$el.querySelectorAll(".close-button")[0];
    let el = this.$el;
    close_button.addEventListener("click", function(){
      el.classList.add("hidden");
    });
  }
});

  
