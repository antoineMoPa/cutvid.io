Vue.component('sequence-effect', {
  template: `
  <div class="sequence-effect">
    <p class="effect" v-if="effect == null">
      Start by choosing an effect!
    </p>
    <div class="effect">
      <div class="effect-header" v-if="effect != null">
        {{ effect.human_name || effect.name }}
      </div>
      <div class="component-container" ref="componentContainer">
      </div>
    </div>
    <div class="text-right">
      <br><br> <!-- Keep some space -->
      <button v-if="effect == null"
              v-on:click="onChangeEffect">
        <img src="icons/feather/plus.svg" width="20"/>
        Add video or effects
      </button>
      <button v-else
              v-on:click="onChangeEffect">
        <img src="icons/feather/edit.svg" width="20"/>
        Change Effect
      </button>
    </div>
    <effects-selector ref="effectSelector" v-on:chooseEffect="changeEffect"/>
  </div>`,
  data(){
    return {
      effect: null,
      moving: false
    };
  },
  props: ["player", "active", "index", "initialEffectGetter", "initialEffectName"],
  methods: {
    loadPrograms(name, pass_count, onProgramReady) {
      let app = this;

      function compileProgram(vertex, fragment){
        let pass = new ShaderProgram(app.player.gl);

        try{
          pass.compile(vertex, fragment);
        } catch (e) {
          console.log(e);
        }

        return pass;
      }

      let fileLoadPromises = [];

      // Random makes sure cache is not using an old version
      // (Ok I maybe once every 200 years this will not work...)
      let rand = Math.random();

      if(pass_count == 1){
        fileLoadPromises.push(fetch(
          "plugins/" + name + "/vertex.glsl?" + rand
        ));
        fileLoadPromises.push(fetch(
          "plugins/" + name + "/fragment.glsl?" + rand
        ));
      } else {
        for(let i = 1; i <= pass_count; i++){
          fileLoadPromises.push(fetch(
            "plugins/" + name + "/vertex"+i+".glsl?" + rand
          ));
          fileLoadPromises.push(fetch(
            "plugins/" + name + "/fragment"+i+".glsl?" + rand
          ));
        }
      }


      Promise.all(fileLoadPromises).then((values) => {
        let textPromises = values.map((p) => {return p.text()});
        Promise.all(textPromises)
          .then((values) => {
            let programs = [];
            // Parse all shaders for all passes
            for(let pass = 0; pass*2 < values.length; pass++){
              let vertex = values[2*pass+0];
              let fragment = values[2*pass+1];
              let program = compileProgram(vertex, fragment);
              programs.push(program);
            }
            onProgramReady(programs);
          });
      });
    },
    serialize(){
      return this.serializeEffect(this.effect);
    },
    unserialize(effectData, noApply){
      let app = this;

      this.$emit("register", this.index, this.effect);

      let promise = null;

      if(effectData == null){
        return;
      }

      let effectName = effectData.effectName;
      let currentPromiseGetter = function(){
        return app.changeEffect(effectName, effectData, false);
      };

      if(promise == null){
        promise = currentPromiseGetter();
      } else {
        promise = promise.then(currentPromiseGetter);
      }

      if(promise == null){
        return Promise.resolve();
      }

      if(noApply){
        return promise;
      } else {
        return promise.then(this.applyEffectChange);
      }
    },
    changeEffect(effectName, initialData, autoApply){
      let app = this;

      fetch("/stats/lattefx_app_load_effect/"+effectName);

      if(autoApply == undefined){
        autoApply = true;
      }

      return new Promise(function(resolve, reject){
        utils.load_script("plugins/" + effectName + "/settings.js", function(){
          // Keeping unique components makes sure the components aren't reset
          let settings = utils.plugins[effectName + "-effectSettings"]();
          let uniqueEffectComponentID = utils.increment_unique_counter("effectComponent");
          let componentName = effectName + "-effect-settings";

          let pass_count = 1;
          if(settings.pass_count != undefined){
            pass_count = settings.pass_count;
          }

          app.loadPrograms(effectName, pass_count, function(_shaderPrograms){
            let container = document.createElement("div");

            if(app.last_plugin != undefined){
              app.last_plugin.$destroy();
              app.$refs.componentContainer.innerHTML = "";
            }

            app.$refs.componentContainer.appendChild(container);
            settings.ui.el = container;
            let plugin = new Vue(settings.ui);

            app.last_plugin = plugin;
            app.last_el = container;

            plugin.effect = settings;
            plugin.effect.uniforms = plugin.uniforms;
            plugin.player = app.player;
            app.plugin = plugin;
            app.$emit("register", app.index, plugin.effect);
            settings.effectName = effectName;
            settings.component = componentName;
            plugin.onDuration = app.onDuration;
            settings.id = uniqueEffectComponentID;
            plugin.shaderProgram = _shaderPrograms[0];
            plugin.effect.shaderProgram = _shaderPrograms[0];


            // Insert effect in array
            app.effect = settings;

            app.$nextTick(function(){
              app.updateTexts();

              // Load initial data if it is given in argument
              if(initialData != undefined){
                app.unserializeEffect(initialData);
              }

              let component = app.plugin;
              component.active = this.active;


              if(autoApply){
                app.applyEffectChange();
              }

              resolve();
            });
          });
        });
      });
    },
    serializeEffect(){
      let effect = this.effect;

      if(effect == null){
        return null;
      }

      let component = this.plugin;
      let data = utils.serialize_vue(component.$data);
      data.effectName = effect.name;
      return data;
    },
    unserializeEffect(data){
      let component = this.plugin;

      if(data != undefined){
        // Put data in component data
        utils.unserialize_vue(component.$data, data);
      }

      component.active = this.active;

      // Update uniforms
      this.applyEffectChange();
    },
    applyEffectChange(){
      this.$emit("effectChanged", this.effect);
    },
    onChangeEffect(){
      let app = this;
      this.$refs['effectSelector'].open(function(effectName){
        app.changeEffect(effectName);
      });
    },
    launchEffectSelector(callback){
      let app = this;
      callback = callback || function(effectName){
        app.changeEffect(effectName);
      };

      this.$refs['effectSelector'].open(callback);
    },
    updateTexts(){
      let app = this;
      let comp = this.plugin;
      if("updateTexts" in comp && "texts" in comp){
        comp.updateTexts();
      }
    },
    ready(){
      this.$emit("ready");
      console.log("read");
    },
    onDuration(duration){
      this.$emit('duration', {
        sequence: this.index,
        duration: duration
      });
    }
  },
  watch: {
    active(val){
      if (this.plugin != undefined) {
        let comp = this.plugin;
        comp.active = val;
      }
    },
  },
  mounted(){
    if(this.initialEffectGetter != undefined){
      let effect = this.initialEffectGetter();
      this.unserialize(effect, false);
    } else if (this.initialEffectName != undefined){
      this.changeEffect(this.initialEffectName);
    }
  }
});
