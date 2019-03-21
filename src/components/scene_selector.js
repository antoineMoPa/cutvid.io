Vue.component('scene-selector', {
  template: `
  <div class="scene-selector">
    <div class="scene-selector-title">
      scenes
    </div>
    <transition-group name="fade">
      <div v-for="(sceneNumber, sceneIndex) in scenesIndex"
           v-on:click="switch_to(sceneIndex)"
           v-bind:key="'scene-'+scenes[sceneNumber].id"
           v-bind:class="'scene' + ' ' + (selected == sceneIndex? 'selected-scene': '')">
        <!--
        Copy: todo
        <img src="icons/feather/copy.svg"
             title="copy scene"
             v-on:click="copyScene(sceneIndex)"
             width="15"
             class="copy-scene scene-selector-icon"/>
        -->
        <img src="icons/feather/arrow-left.svg"
             title="Move scene earlier in video"
             v-on:click.stop="left(sceneIndex)"
             width="15"
             class="move-scene-left scene-selector-icon"/>
        <img src="icons/feather/arrow-right.svg"
             title="Move scene later in video"
             v-on:click.stop="right(sceneIndex)"
             width="15"
             class="move-scene-right scene-selector-icon"/>
        <img src="icons/feather/trash.svg"
             title="remove scene"
             v-on:click.stop="remove(sceneNumber, sceneIndex)"
             v-if="scenesIndex.length > 1"
             width="15"
             class="remove-scene scene-selector-icon"/>
        <img src=""
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
        <input type="number" min="0" max="300" step="0.1" v-model="scenes[sceneNumber].duration">
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
    switch_to(index){
      if(index > this.scenes.length || index < 0){
        return;
      }
      this.selected = index;
      this.effectsChanged(this.selected);
    },
    copyScene(i){
      let uniqueSceneID = utils.increment_unique_counter("scene");
      // todo
    },
    postponePreview(index){
      setTimeout(this.setPreview.bind(this, index), 500 + Math.random() * 100);
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
        let ratio = canvas.width/canvas.height;

        tempCanvas.width = 100*ratio;
        tempCanvas.height = 100;
        ctx.drawImage(canvas, 0, 0, 100*ratio, 100);
        preview.src = tempCanvas.toDataURL();
        app.player.scenes = oldScenes;
      });
    },
    serialize(){
      let data = [];
      for(let sceneIndex in this.scenesIndex){
        let scene = this.scenes[this.scenesIndex[sceneIndex]];
        let component = this.$refs['effects-settings-' + scene.id][0];
        data.push({
          effects: component.serialize(),
          duration:  scene.duration
        });
      }
      return data;
    },
    unserialize(data){
      this.scenes.splice(0);
      this.scenesIndex.splice(0);
      for(let sceneIndex in data){
        let sceneData = data[sceneIndex];
        this.addScene(sceneData);
      }
    },
    addSceneButton(){
      let app = this;
      app.addScene();
    },
    addScene(initialData){
      let uniqueSceneID = utils.increment_unique_counter("scene");
      let settings = {
        id: uniqueSceneID,
        duration: 1.0,
      };
      this.scenes.splice(this.scenes.length, 0, settings);
      this.scenesIndex.splice(this.scenesIndex.length, 0, this.scenes.length - 1);
      this.$nextTick(function(){
        let component = this.$refs['effects-settings-' + settings.id];
        if(component == undefined){
          return;
        }
        component = component[0];

        // Unserialize if needed
        if(initialData != undefined){
          component.unserialize(initialData.effects);
          settings.duration = initialData.duration;
        }
        this.setPreview(this.scenesIndex.length - 1);
      });
    },
    right(sceneIndex){
      if(sceneIndex > this.scenesIndex.length - 1){
        return;
      }

      let old = this.scenesIndex[sceneIndex];
      let oldScene = this.scenes[old];
      let component = this.$refs['effects-settings-' + oldScene.id][0];
      let oldData = component.serialize();

      this.scenesIndex.splice(sceneIndex, 1);

      setTimeout(function(){
        this.scenesIndex.splice(sceneIndex + 1, 0, old);
        this.$nextTick(function(){
          let index = this.scenesIndex[sceneIndex + 1];
          let component = this.$refs['effects-settings-' + this.scenes[index].id][0];
          component.unserialize(oldData);
        });
      }.bind(this), 300);
    },
    left(sceneIndex){
      if(sceneIndex < 1){
        return;
      }

      let old = this.scenesIndex[sceneIndex];
      let oldScene = this.scenes[old];
      let component = this.$refs['effects-settings-' + oldScene.id][0];
      let oldData = component.serialize();

      this.scenesIndex.splice(sceneIndex, 1);

      setTimeout(function(){
        this.scenesIndex.splice(sceneIndex - 1, 0, old);

        this.$nextTick(function(){
          let index = this.scenesIndex[sceneIndex - 1];
          let component = this.$refs['effects-settings-' + this.scenes[index].id][0];
          component.unserialize(oldData);
        });
      }.bind(this), 300);
    },
    remove(sceneNumber, sceneIndex){
      // Don't delete last scene
      if(this.scenesIndex.length < 1){
        return;
      }

      // Decrement all elements after current index
      this.scenesIndex = this.scenesIndex.map((number) => {return number > sceneNumber? number - 1: number; });

      this.scenesIndex.splice(sceneIndex, 1);
      this.scenes.splice(sceneNumber, 1);

      this.$nextTick(function(){
        if(sceneIndex == this.selected){
          if(sceneIndex >= this.scenesIndex.length - 1){
            this.switch_to(sceneIndex-1);
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

      if(this.player == undefined){
        return;
      }
      let scene = this.scenes[this.scenesIndex[sceneIndex]];

      this.playAll();
      this.player.animate_force_scene = sceneIndex;
      this.setPreview(this.selected);
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
    }
  },
  watch: {
  },
  mounted(){
    let allEffects = this.$el.querySelectorAll(".all-effects")[0];
    let allEffectsContainer = document.querySelectorAll(".all-effects-container")[0];
    allEffectsContainer.appendChild(allEffects);

    let allScenes = this.$el.querySelectorAll(".all-scenes")[0];
    let allScenesContainer = document.querySelectorAll(".all-scenes-container")[0];
    allScenesContainer.appendChild(allScenes);

    this.$nextTick(function(){
      // Add at least one empty scene
      this.addScene();
    });
  }
});
