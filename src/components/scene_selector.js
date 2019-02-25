Vue.component('scene-selector', {
  template: `
  <div class="scene-selector">
    <div class="scene-selector-title">
      scenes
    </div>
    <transition-group name="fade">
      <div v-bind:key="scenes[sceneNumber].id" 
           v-for="(sceneNumber, sceneIndex) in scenesIndex"
           v-bind:class="'scene' + ' ' + (selected == sceneIndex? 'selected-scene': '')">
        <!--
        Copy: todo
        <img src="icons/feather/copy.svg" 
             title="copy scene"
             v-on:click="copyScene(sceneIndex)"
             width="20"
             class="copy-scene"/>
        -->
        <img src="icons/feather/trash.svg" 
             title="remove scene"
             v-on:click="remove(sceneIndex)"
             v-if="scenesIndex.length > 1"
             width="20"
             class="remove-scene"/>
        <img v-on:click="switch_to(sceneIndex)"
             src=""
             v-bind:class="'scene-preview scene-preview-' + scenes[sceneNumber].id"/>
      </div>
    </transition-group>
    <div class="adder-container">
      <button v-on:click="addSceneButton">
        <img src="icons/feather/plus.svg" title="new scene" width="20"/>
      </button>
    </div>
    <!-- These effects are all added to the panel 
         at the left manually in mounted() -->
    <div class="all-effects">
      <effects-settings
        v-for="(sceneNumber, sceneIndex) in scenesIndex"
        v-bind:class="(selected == sceneIndex)? '': 'effects-settings-hidden'"
        v-bind:key="'effects-settings-' + scenes[sceneNumber].id" 
        v-bind:ref="'effects-settings-' + scenes[sceneNumber].id" 
        v-bind:defaultEffect="scenes[sceneNumber].defaultEffect"
        v-on:effectsChanged="effectsChanged" 
        v-bind:player="player"/>
    </div>
    <effects-selector ref="effects-selector"/>
  </div>`,
  data(){
    return {
      scenes: [],
      scenesIndex: [],
      selected: 0,
    };
  },
  props: ["player"],
  methods: {
    switch_to(i){
      this.selected = i;
      this.effectsChanged(i, this.getSceneEffects(i));
    },
    copyScene(i){
      let uniqueSceneID = utils.increment_unique_counter("scene");
      // todo
    },
    postponePreview(index){
      setTimeout(this.setPreview.bind(this, index), 100 + Math.random() * 100);
    },
    setPreview(index){
      let app = this;
      
      // Sometimes, player is not yet ready at page load
      if(app.player == undefined){
        this.postponePreview(index);
        return;
      }
      
      let effects = this.getSceneEffects(index);
      app.player.passes = effects;
      app.player.render(0, function(canvas){
        app.$nextTick(function(){
          if(canvas == undefined){
            this.postponePreview(index);
          }
          
          let id = app.scenes[app.scenesIndex[index]].id;
          let preview = document.querySelectorAll(".scene-preview-" + id)[0];
          let tempCanvas = document.createElement("canvas");
          let ctx = tempCanvas.getContext("2d");
          
          tempCanvas.width = 100;
          tempCanvas.height = 100;
          ctx.drawImage(canvas, 0, 0, 100, 100);
          preview.src = tempCanvas.toDataURL();
        });
      });
    },
    addSceneButton(){
      let app = this;
      this.$refs['effects-selector'].open(function(effectName){
        app.addScene(effectName);
      });
    },
    addScene(themeName){
      let uniqueSceneID = utils.increment_unique_counter("scene");
      let settings = {
        id: uniqueSceneID,
        defaultEffect: themeName
      };
      this.scenes.splice(this.scenes.length, 0, settings);
      this.scenesIndex.splice(this.scenesIndex.length, 0, this.scenes.length - 1);
      this.$nextTick(function(){
        this.switch_to(this.scenesIndex.length - 1);
        this.setPreview(this.scenesIndex.length - 1);
      });
    },
    right(sceneIndex){
      if(sceneIndex > this.scenesIndex.length - 1){
        return;
      }
      
      let old = this.scenesIndex[sceneIndex];
      this.scenesIndex.splice(sceneIndex, 1);
      
      setTimeout(function(){
        this.scenesIndex.splice(sceneIndex + 1, 0, old);
      }.bind(this), 300);
    },
    left(sceneIndex){
      if(sceneIndex < 1){
        return;
      }

      let old = this.scenesIndex[sceneIndex];
      this.scenesIndex.splice(sceneIndex, 1);
      
      setTimeout(function(){
        this.scenesIndex.splice(sceneIndex - 1, 0, old);
      }.bind(this), 300);
    },
    remove(sceneIndex){
      let number = this.scenesIndex[sceneIndex];
      
      // Don't delete last scene
      if(this.scenesIndex.length < 1){
        return;
      }
      
      if(sceneIndex == this.selected){
        if(sceneIndex >= this.scenesIndex.length - 1){
          this.switch_to(sceneIndex - 1);
        } else {
          this.switch_to(sceneIndex);
        }
      } else if (this.selected > sceneIndex) {
        this.switch_to(this.selected - 1);
      }
      
      // Decrement all elements after current index
      this.scenesIndex = this.scenesIndex.map((i) => { return i <= sceneIndex? i: i - 1; });
      this.scenesIndex.splice(sceneIndex, 1);
      this.scenes.splice(number, 1);
    },
    getSceneEffects(index){
      let component = this.$refs['effects-settings-' + index];
      
      if(component == undefined){
        return [];
      }
      component = component[0];
      return component.getOrderedEffects();
    },
    effectsChanged(effects){
      if(this.player == undefined){
        return;
      }
      this.player.passes = effects;
      this.setPreview(this.selected);
    },
    updateTexts(){
      let app = this;
      this.$nextTick(function(){
        app.$refs['effects-settings-' + this.selected][0].updateTexts();
      });
    },
    updateAllPreviews(){
      this.$nextTick(function(){
        let app = this;
        app.updateTexts(function(){
          for(let i in app.scenesIndex){
            app.setPreview(i);
          }
        });
      });
    }
  },
  watch: {
    player(){
      this.updateAllPreviews();
    }
  },
  mounted(){
    this.addScene("epicSunset");
    this.addScene("retrowave");
    this.addScene("textLayer");
    let allEffects = this.$el.querySelectorAll(".all-effects")[0];
    let allEffectsContainer = document.querySelectorAll(".all-effects-container")[0];
    allEffectsContainer.appendChild(allEffects);
    this.$nextTick(function(){
      this.updateAllPreviews();
    });
  }
});
