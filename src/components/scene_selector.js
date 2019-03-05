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
        v-on:ready="effectsSettingsReady(sceneIndex)"
        v-bind:defaultEffect="scenes[sceneNumber].defaultEffect"
        v-on:effectsChanged="effectsChanged(sceneIndex)"
        v-bind:player="player"/>
    </div>
    <div class="all-scenes">
      <div
        v-for="(sceneNumber, sceneIndex) in scenesIndex"
        v-if="selected == sceneIndex"
        v-bind:key="'effects-settings-' + scenes[sceneNumber].id"
      >
        <label>Duration (seconds)</label>
        <input type="number" min="0" max="30" step="0.1" v-model="scenes[sceneNumber].duration">
      </div>
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
      this.effectsChanged(this.selected);
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

      let oldScenes = this.player.scenes;

      let scene = app.scenes[this.scenesIndex[index]];
      app.player.scenes = [{
        scene: scene,
        passes: this.getSceneEffects(index)
      }];

      app.player.render(0, function(canvas){
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
        app.player.scenes = oldScenes;
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
        defaultEffect: themeName,
        duration: 1.0,
      };
      this.scenes.splice(this.scenes.length, 0, settings);
      this.scenesIndex.splice(this.scenesIndex.length, 0, this.scenes.length - 1);
      this.$nextTick(function(){
        let component = this.$refs['effects-settings-' + settings.id][0];
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

      // Decrement all elements after current index
      this.scenesIndex = this.scenesIndex.map((i) => { return i <= sceneIndex? i: i - 1; });
      this.scenesIndex.splice(sceneIndex, 1);
      this.scenes.splice(number, 1);

      this.$nextTick(function(){
        if(sceneIndex == this.selected){
          if(sceneIndex >= this.scenesIndex.length - 1){
            this.switch_to(sceneIndex - 1);
          } else {
            this.switch_to(sceneIndex);
          }
        } else if (this.selected > sceneIndex) {
          this.switch_to(this.selected - 1);
        }
      });
    },
    getSceneEffects(index){
      let effect = this.scenes[this.scenesIndex[index]];
      let component = this.$refs['effects-settings-' + effect.id];

      if(component == undefined || component[0] == undefined){
        return [];
      }

      component = component[0];

      return component.getOrderedEffects();
    },
    effectsChanged(sceneIndex){
      let app = this;

      if(app.player == undefined){
        return;
      }
      let scene = app.scenes[this.scenesIndex[sceneIndex]];
      app.player.scenes = [{
        scene: scene,
        passes: this.getSceneEffects(sceneIndex)
      }];
      app.setPreview(app.selected);
      this.$emit("playLooping");
    },
    effectsSettingsReady(index){
      this.setPreview(index);
    },
    playAll(){
      let scenes = [];
      for(let i in this.scenesIndex){
        let scene = this.scenes[this.scenesIndex[i]];
        scenes.push({
          scene: scene,
          passes: this.getSceneEffects(i)
        });
      }
      this.player.scenes = scenes;
    },
    updateTexts(){
      let app = this;
      this.$nextTick(function(){
        app.$refs['effects-settings-' + this.selected][0].updateTexts();
      });
    }
  },
  watch: {
  },
  mounted(){
    //this.addScene("epicSunset");
    //this.addScene("retrowave");
    //this.addScene("textLayer");
	this.addScene("logoReveal");
	
    let allEffects = this.$el.querySelectorAll(".all-effects")[0];
    let allEffectsContainer = document.querySelectorAll(".all-effects-container")[0];
    allEffectsContainer.appendChild(allEffects);

    let allScenes = this.$el.querySelectorAll(".all-scenes")[0];
    let allScenesContainer = document.querySelectorAll(".all-scenes-container")[0];
    allScenesContainer.appendChild(allScenes);
  }
});
