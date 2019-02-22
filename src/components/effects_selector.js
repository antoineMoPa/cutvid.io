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
    <img v-bind:src='"plugins/pp/" + effect + "/preview.png"'/>
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
		"default": {
		  "description": "A retro sunset."
		},
	  },
    };
  },
  methods: {
	chooseEffect(effect){
	  let effects_selector = document.querySelectorAll(".effects-selector")[0];
	  effects_selector.classList.add("hidden");
	  this.$emit("chooseEffect", effect);
	}
  },
  mounted(){
	document.body.append(this.$el);
  }
});

  
