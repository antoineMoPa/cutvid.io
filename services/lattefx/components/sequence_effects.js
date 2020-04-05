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
        Change Sequence Type
      </button>
    </div>
    <effects-selector ref="effectSelector" v-on:chooseEffect="changeEffect"/>
  </div>`,
  data(){
    return {
      effect: null,
      moving: false,
      vertex_shader: `attribute vec3 position;
/* If you change this, please change it in the renderer too. */
/* Thank you, have a nice day. */

varying vec2 UV;
varying vec2 lastUV;
varying vec3 v_position;
uniform vec2 renderBufferRatio;
uniform float rotate_angle, ratio;

void main(){

  v_position = position * vec3(1.0, 1.0, 1.0);

  float rad = rotate_angle / 180.0 * 3.141542069;
  v_position.xy *= mat2(cos(rad), -sin(rad)/ratio,
                        sin(rad)*ratio,  cos(rad));

  UV = vec2((position.x+1.0) / 2.0, (position.y + 1.0)/2.0);

  lastUV = UV / renderBufferRatio;
  gl_Position = vec4(v_position.x,v_position.y, 0.0, 1.0);
}
`
    };
  },
  props: ["player", "active", "index", "initialEffectGetter", "initialEffectName"],
  methods: {
    expose(){
      let API = window.API;

      API.expose({
        name: "sequence_effects.reload_effect",
        doc: `Reload effect

        If load_script is false, we will not reload the script from source.

        An example of when we don't want to reload is the live effect editor,
        which takes care of reloading with a hacked version.
        `,
        fn: function(load_script = true){
          let data = this.serializeEffect();
          this.changeEffect(
            this.effect.effectName,
            data,
            true,
            {load_script: load_script}
          );
        }.bind(this),
        no_ui: true
      });

    },
    async loadPrograms(name, pass_count, onProgramReady) {
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

      // Random makes sure cache is not using an old version
      // (Ok I maybe once every 200 years this will not work...)
      let rand = utils.randurl_param;
      let fragment_fetch = await fetch("plugins/" + name + "/fragment.glsl" + rand);
      let fragment_text = await fragment_fetch.text();

      let program = compileProgram(app.vertex_shader, fragment_text);
      onProgramReady(program);
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
    changeEffect(effectName, initialData, autoApply, options){
      let app = this;
      options = options || {};
      options.load_script = options.load_script || true;

      fetch("/stats/lattefx_app_load_effect/"+effectName);

      if(autoApply == undefined){
        autoApply = true;
      }

      return new Promise(async function(resolve, reject){
        if(options.load_script){
          await utils.load_script("plugins/" + effectName + "/settings.js");
        }
        // Keeping unique components makes sure the components aren't reset
        let settings = utils.plugins[effectName + "-effectSettings"]();
        let uniqueEffectComponentID = utils.increment_unique_counter("effectComponent");
        let componentName = effectName + "-effect-settings";

        let pass_count = 1;
        if(settings.pass_count != undefined){
          pass_count = settings.pass_count;
        }

        app.loadPrograms(effectName, pass_count, function(_shaderProgram){
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

          // Some of these might not be needed anymore
          // that could be some phd thesis work to figure out which
          plugin.effect = settings;
          plugin.effect.uniforms = plugin.uniforms;
          plugin.player = app.player;
          app.plugin = plugin;
          app.$emit("register", app.index, plugin.effect);
          settings.effectName = effectName;
          settings.component = componentName;
          plugin.onDuration = app.onDuration;
          settings.id = uniqueEffectComponentID;
          plugin.shaderProgram = _shaderProgram;
          plugin.effect.shaderProgram = _shaderProgram;


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
    },
    serializeEffect(){
      let effect = this.effect;

      if(effect == null){
        return null;
      }

      let component = this.plugin;
      let data = {};

      if(component.serialize != undefined){
        // Some plugins have a custom
        // serialisation method
        data = component.serialize();
      } else {
        data = utils.serialize_vue(component.$data);
      }

      data.effectName = effect.name;
      return data;
    },
    unserializeEffect(data){
      let component = this.plugin;

      if(data != undefined){
        if(this.plugin.unserialize != undefined){
          this.plugin.unserialize(data);
        } else {
          // Put data in component data
          utils.unserialize_vue(component.$data, data);
        }
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

    this.expose();
  },
  beforeDestroy(){
    if(this.last_plugin != undefined){
      this.last_plugin.$destroy();
    }
  }
});
