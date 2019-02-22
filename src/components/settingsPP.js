Vue.component('settings-pp', {
  template: `
  <div class="settings-pp">
    <transition-group name="fade">
      <div class="effect" 
           v-bind:key="effects[effectNumber].id" 
           v-for="(effectNumber, effectIndex) in effectsIndex">
        <div class="pp-effect-header">
          {{ effects[effectNumber].human_name || effects[effectNumber].name }}
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
          <component v-bind:is="effects[effectNumber].component" v-on:uniforms="receiveUniforms.bind(effects[effectNumber])"></component>
        </div>
      </div>
    </transition-group>
    <button v-on:click="effects_selector">
      <img src="icons/feather-dark/plus.svg" width="20"/>
      Add effect
    </button>
    <effects-selector v-on:chooseEffect="addEffect"/>
  </div>`,
  data(){
    return {
	  effects: [],
      effectsIndex: [],
	  moving: false
    };
  },
  props: ["player"],
  methods: {
    loadProgram(name, onProgramReady) {
      let app = this;
        
      function onShadersReady(vertex, fragment){
	    let pass = new ShaderProgram(app.player.gl);
        
        try{
	      pass.compile(vertex, fragment);
        } catch (e) {
          console.log(e);
        }

        onProgramReady(pass);
      }
      
      Promise.all([
	    fetch("plugins/" + name + "/vertex.glsl"),
	    fetch("plugins/" + name + "/fragment.glsl")
      ]).then((values) => {
	    Promise.all([
	      values[0].text(),
	      values[1].text()
	    ]).then((values) => {
	      let vertex = values[0];
	      let fragment = values[1];
	      this.vertex = vertex;
	      this.fragment = fragment;
	      onShadersReady(vertex, fragment);
	    });
      });
    },
    addEffect(themeName){
	  let app = this;
	  utils.load_script("plugins/" + themeName + "/settings.js", function(){
        // Keeping unique components makes sure the components aren't reset
		let settings = utils.plugins[themeName + "-settingsPP"]();
		let uniquePPComponentID = utils.increment_unique_counter("ppcomponent");
		let componentName = themeName + "-settingsPP" + uniquePPComponentID;
		let comp = Vue.component(componentName, settings.ui);
		settings.component = componentName;
		settings.id = uniquePPComponentID;
        app.loadProgram(themeName, function(program){
          settings.shaderProgram = program;
          
          settings.uniforms = {};
          
          // Insert effect in array
          app.effects.splice(app.effects.length, 0, settings);
          // Add its index
		  app.effectsIndex.splice(app.effectsIndex.length, 0, app.effects.length - 1);
          app.applyEffectsChange();
        });
	  });
    },
    down(effectIndex){
      if(this.moving || effectIndex > this.effectsIndex.length - 1){
        return;
      }
      this.moving = true;
      let old = this.effectsIndex[effectIndex];
      this.effectsIndex.splice(effectIndex, 1);
      
      setTimeout(function(){
        this.effectsIndex.splice(effectIndex + 1, 0, old);
        this.applyEffectsChange();
		this.moving = false;
      }.bind(this), 300);
    },
    up(effectIndex){
      if(this.moving || effectIndex < 1){
        return;
      }
	  this.moving = true;
      let old = this.effectsIndex[effectIndex];
      this.effectsIndex.splice(effectIndex, 1);
      
      setTimeout(function(){
        this.effectsIndex.splice(effectIndex - 1, 0, old);
        this.applyEffectsChange();
		this.moving = false;
      }.bind(this), 300);
    },
    remove(effectIndex){
	  // Fix bug when double removing
	  if(this.effectsIndex[effectIndex] == undefined){
		return;
	  }
	  
      let number = this.effectsIndex[effectIndex];
      // Decrement all elements after current index
      this.effectsIndex = this.effectsIndex.map((i) => { return i <= effectIndex? i: i - 1; });
      this.effectsIndex.splice(effectIndex, 1);
      this.effects.splice(number, 1);
      this.applyEffectsChange();
    },
    receiveUniforms(effectIndex, uniforms){
      this.effects.uniforms = uniforms;
    },
    applyEffectsChange(){
      let app = this;
      let orderedEffects = [];
      
      this.effectsIndex.forEach(function(i){
        orderedEffects.push({
          shaderProgram: app.effects[i].shaderProgram,
          uniforms: app.effects[i].uniforms
        });
      });

      this.$emit("effectsChanged", orderedEffects);
    },
	effects_selector(){
	  let effects_selector = document.querySelectorAll(".effects-selector")[0];
	  effects_selector.classList.toggle("hidden");
	  let close_button = effects_selector.querySelectorAll(".close-button")[0];
	  close_button.addEventListener("click", function(){
		effects_selector.classList.add("hidden");
	  });
	}
  },
  mounted(){
    this.addEffect('textLayer');
    this.addEffect('vignette');
  }
});
