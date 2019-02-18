var uniquePPComponentCounter = 0; // Mostly a hack

Vue.component('settings-pp', {
  template: `
  <div class="settings-pp">
    <transition-group name="fade">
      <div class="effect" v-bind:key="effects[effectNumber].id" v-for="(effectNumber, effectIndex) in effectsIndex">
        <div class="pp-effect-header">
          {{ effects[effectNumber].name + effects[effectNumber].id }}
          <div class="pp-effect-icons">
          
            <img class="effect-icon"
                 title="move effect down"
                 v-if="effectIndex < effectsIndex.length - 1"
                 v-on:click="down(effectIndex)" 
                 src="icons/feather/arrow-down.svg" width="15"/>
            <img class="effect-icon"
                 v-if="effectIndex > 0"
                 title="move effect up"
                 v-on:click="up(effectIndex)" 
                 src="icons/feather/arrow-up.svg" width="15"/>
            <img class="effect-icon" 
                 v-on:click="remove(effectIndex)" 
                 title="remove effect"
                 src="icons/feather/x.svg" width="15"/>
          
          </div>
        </div>
        <div class="component-container">
          <component v-bind:is="effects[effectNumber].component"></component>
        </div>
      </div>
    </transition-group>
    <button v-on:click="addEffect('default')">
      <img src="icons/feather-dark/plus.svg" width="20"/>
      Add effect
    </button>
  </div>`,
  data(){
    return {
	  effects: [],
      effectsIndex: []
    };
  },
  methods: {
    addEffect(themeName){
	  let app = this;
	  utils.load_script("plugins/pp/" + themeName + "/settings.js", function(){
        // Keeping unique components makes sure the components aren't reset
		let settings = utils.plugins[themeName + "-settingsPP"];
		let componentName = themeName + "-settingsPP" + uniquePPComponentCounter;
		Vue.component(componentName, settings.ui);
		settings.component = componentName;
		settings.id = uniquePPComponentCounter;
        uniquePPComponentCounter++;
		app.effects.splice(app.effects.length, 0, settings);
		app.effectsIndex.splice(app.effectsIndex.length, 0, app.effects.length - 1);
		app.applyEffectsChange();
	  });
    },
    down(effectIndex){
      if(effectIndex > this.effectsIndex.length - 1){
        return;
      }
      
      let old = this.effectsIndex[effectIndex];
      this.effectsIndex.splice(effectIndex, 1);
      
      setTimeout(function(){
        this.effectsIndex.splice(effectIndex + 1, 0, old);
        this.applyEffectsChange();
      }.bind(this), 300);
    },
    up(effectIndex){
      if(effectIndex < 1){
        return;
      }

      let old = this.effectsIndex[effectIndex];
      this.effectsIndex.splice(effectIndex, 1);
      
      setTimeout(function(){
        this.effectsIndex.splice(effectIndex - 1, 0, old);
        this.applyEffectsChange();
      }.bind(this), 300);
    },
    remove(effectIndex){
      let number = this.effectsIndex[effectIndex];
      // Decrement all elements after current index
      this.effectsIndex = this.effectsIndex.map((i) => { return i <= effectIndex? i: i - 1; });
      this.effectsIndex.splice(effectIndex, 1);
      this.effects.splice(number, 1);
      this.applyEffectsChange();
    },
    applyEffectsChange(){
      this.$emit("effectsChanged", this.$data);
    }
  },
  mounted(){
    this.addEffect('default');
    this.addEffect('retrowave');
  }
});
