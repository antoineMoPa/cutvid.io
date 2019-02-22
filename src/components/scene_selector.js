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
  </div>`,
  data(){
    return {
	  scenes: [],
	  scenesIndex: [],
      selected: 0,
    };
  },
  methods: {
    switch_to(i){
      this.selected = i;
      this.$emit("switch-to-scene", i);
	  this.$nextTick(function(){
		this.setCurrentPreview();
	  });
    },
	copyScene(i){
	  let uniqueSceneID = utils.increment_unique_counter("scene");
	  // todo
	},
	setCurrentPreview(){
	  let canvas = document.querySelectorAll("#main-player .canvas-container  canvas")[0];
	  if(canvas == undefined){
		return;
	  }
	  
	  let id = this.scenes[this.selected].id;
	  let preview = document.querySelectorAll(".scene-preview-" + id)[0];
	  let tempCanvas = document.createElement("canvas");
	  let ctx = tempCanvas.getContext("2d");
	  tempCanvas.width = 100;
	  tempCanvas.height = 100;
	  ctx.drawImage(canvas, 0, 0, 100, 100);
	  preview.src = tempCanvas.toDataURL();
	},
	addSceneButton(){
	  let app = this;
	  this.$emit("launch-effect-selector", function(effectName){
		app.addScene(effectName);
	  });
	},
	addScene(themeName){
	  let app = this;
	  let uniqueSceneID = utils.increment_unique_counter("scene");
	  let settings = {
		id: uniqueSceneID
	  };
	  app.scenes.splice(app.scenes.length, 0, settings);
	  app.scenesIndex.splice(app.scenesIndex.length, 0, app.scenes.length - 1);
	  this.switch_to(this.scenesIndex.length - 1);
	  this.$nextTick(function(){
		app.setCurrentPreview();
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
  },
  mounted(){
	this.addScene("default");
	this.addScene("retrowave");
  }
});
