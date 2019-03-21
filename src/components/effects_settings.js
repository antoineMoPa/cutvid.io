/*
  Convention for the index:

  effectIndex is the index in effectsIndex and returns the scene
  position is the real data array

  effectNumber = this.effectsIndex[effectIndex]
  effect = this.effects[effectNumber]

  The index allows moving effects around without removing any data.

  (However, it makes the code a bit tougher to read and work with)
*/

Vue.component('effects-settings', {
  template: `
  <div class="effects-settings">
    <p v-if="effectsIndex.length == 0">
      Start by adding an effect!
    </p>
    <transition-group name="fade">
      <div class="effect"
           v-bind:key="'effect-container-'+effects[effectNumber].id"
           v-for="(effectNumber, effectIndex) in effectsIndex">
        <div class="effect-header">
          {{ effects[effectNumber].human_name || effects[effectNumber].name }}
          <div class="effect-icons">

            <img class="effect-icon"
                 title="move effect down"
                 v-if="effectIndex < effectsIndex.length - 1"
                 v-on:click.stop="down(effectIndex)"
                 src="icons/feather/arrow-down.svg" width="15"/>
            <img class="effect-icon"
                 v-if="effectIndex > 0"
                 title="move effect up"
                 v-on:click.stop="up(effectIndex)"
                 src="icons/feather/arrow-up.svg" width="15"/>
            <img class="effect-icon"
                 v-on:click.stop="remove(effectNumber, effectIndex)"
                 title="remove effect"
                 src="icons/feather/x.svg" width="15"/>

          </div>
        </div>
        <div class="component-container">
          <component v-bind:is="effects[effectNumber].component"
                     v-bind:ref="effects[effectNumber].component"
                     v-bind:key="'effect-setting-'+effects[effectNumber].component"
                     v-bind:shaderProgram="effects[effectNumber].shaderProgram"
                     v-bind:player="player"
                     v-bind:ready="ready"
                     v-bind:effect="effects[effectNumber]"
                     ></component>
        </div>
      </div>
    </transition-group>
    <div class="text-right">
      <br><br> <!-- Keep some space -->
      <button v-on:click="onAddEffect">
        <img src="icons/feather/plus.svg" width="20"/>
        Add effect
      </button>
    </div>
    <effects-selector ref="effectSelector" v-on:chooseEffect="addEffect"/>
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
        // Random makes sure cache is not using an old version
        // (Ok I maybe once every 200 years this will not work...)
        fetch("plugins/" + name + "/vertex.glsl?" + Math.random()),
        fetch("plugins/" + name + "/fragment.glsl?" + Math.random())
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
          this.applyEffectsChange();
          this.$emit("ready");
        });
      });
    },
    serialize(){
      let data = [];
      for(let effectIndex in this.effectsIndex){
        let effectData = this.serializeEffect(this.effectsIndex[effectIndex]);
        if(effectData == null){
          console.error("Effect dropped. Effect index messed up.");
        }
        data.push(effectData);
      }
      return data;
    },
    unserialize(data){
      this.effects = [];
      this.effectsIndex = [];

      let promise = null;
      for(let effectIndex in data){
        let effectData = data[effectIndex];
        let effectName = effectData.effectName;

        if(promise == null){
          promise = this.addEffect(effectName, effectData);
        } else {
          promise = promise.then(function(){
            this.addEffect(effectName, effectData)
          }.bind(this));
        }
      }
    },
    addEffect(effectName, initialData){
      let app = this;

      var endPromise = new Promise(function(resolve, reject){
        utils.load_script("plugins/" + effectName + "/settings.js", function(){
          // Keeping unique components makes sure the components aren't reset
          let settings = utils.plugins[effectName + "-effectSettings"]();
          let uniqueEffectComponentID = utils.increment_unique_counter("effectComponent");
          let componentName = effectName + "-effect-settings" + uniqueEffectComponentID;
          Vue.component(componentName, settings.ui);

          settings.effectName = effectName;
          settings.component = componentName;
          settings.id = uniqueEffectComponentID;

          app.loadProgram(effectName, function(_shaderProgram){
            settings.shaderProgram = _shaderProgram;
            settings.uniforms = {};

            // Insert effect in array
            app.effects.splice(app.effects.length, 0, settings);
            // Add its index
            app.effectsIndex.splice(app.effectsIndex.length, 0, app.effects.length - 1);
            app.$nextTick(function(){
              app.updateTexts();
              app.applyEffectsChange();

              // Load initial data if it is given in argument
              if(initialData != undefined){
                app.unserializeEffect(app.effectsIndex.length - 1, initialData);
              }

              resolve();
            });
          });
        });
      });

      return endPromise;
    },
    serializeEffect(effectIndex){
      let effect = this.effects[effectIndex];
      // Did we mess up the index?
      if(effect == undefined){
        return null;
      }
      let component = this.$refs[effect.component][0];
      let data = utils.serialize_vue(component.$data);
      data.effectName = effect.name;
      return data;
    },
    unserializeEffect(effectIndex, data){
      let index = this.effectsIndex[effectIndex];
      let component = this.$refs[this.effects[index].component][0];
      // Put data in component data
      utils.unserialize_vue(component.$data, data);
      // Update uniforms
      this.applyEffectsChange();
    },
    down(effectIndex){
      if(this.moving || effectIndex > this.effectsIndex.length - 1){
        return;
      }
      this.moving = true;
      let old = this.effectsIndex[effectIndex];
      let data = this.serializeEffect(old);
      this.effectsIndex.splice(effectIndex, 1);

      setTimeout(function(){
        this.effectsIndex.splice(effectIndex + 1, 0, old);
        this.$nextTick(function(){
          this.unserializeEffect(effectIndex + 1, data);
        });
        this.moving = false;
      }.bind(this), 300);
    },
    up(effectIndex){
      if(this.moving || effectIndex < 1){
        return;
      }
      this.moving = true;
      let old = this.effectsIndex[effectIndex];
      let data = this.serializeEffect(old);
      this.effectsIndex.splice(effectIndex, 1);

      setTimeout(function(){
        this.effectsIndex.splice(effectIndex - 1, 0, old);
        this.$nextTick(function(){
          this.unserializeEffect(effectIndex - 1, data);
        });
        this.moving = false;
      }.bind(this), 300);
    },
    remove(effectNumber, effectIndex){
      // Fix bug when double removing
      if(this.effectsIndex[effectIndex] == undefined){
        return;
      }

      // Decrement all elements after current index
      this.effectsIndex = this.effectsIndex.map((number) => { return number > effectNumber? number-1: number; });
      this.effectsIndex.splice(effectIndex, 1);
      this.effects.splice(effectNumber, 1);

      this.$nextTick(function(){
        this.applyEffectsChange();
      });
    },
    getOrderedEffects(){
      let app = this;
      let orderedEffects = [];

      this.effectsIndex.forEach(function(i){
        if(app.effects[i] == undefined){
          return;
        }
        orderedEffects.push({
          shaderProgram: app.effects[i].shaderProgram,
          uniforms: app.effects[i].uniforms,
          beforeRender: app.effects[i].beforeRender || null
        });
      });
      return orderedEffects;
    },
    applyEffectsChange(){
      let app = this;
      let orderedEffects = this.getOrderedEffects();

      this.$emit("effectsChanged", orderedEffects);
    },
    onAddEffect(){
      let app = this;
      this.$refs['effectSelector'].open(function(effectName){
        app.addEffect(effectName);
      });
    },
    launchEffectSelector(callback){
      this.$refs['effectSelector'].open(callback);
    },
    updateTexts(){
      let app = this;
      for(let effect in this.effects){
        let comp = this.$refs[this.effects[effect].component];
        if(comp == undefined || comp[0].updateTexts == undefined){
          continue;
        }
        comp[0].updateTexts();
      }
    },
    ready(){
      this.$emit("ready");
    }
  },
  mounted(){
  }
});
