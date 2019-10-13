Vue.component('sequencer', {
  template: `
    <div class="sequencer">
      <div class="sequencer-scrollbox">
        <div
          v-for="(sequence, index) in sequences"
          v-bind:class="'sequence ' + ((selected.indexOf(index) != -1)? 'selected': '')"
          v-bind:ref="'sequence-'+sequence.id">
          <div class="sequence-button-left"
               v-on:mousedown="sequenceLeftDown(index)">
          </div>
          <div class="sequence-body"
               v-on:mousedown="sequenceBodyDown(index,$event,false)">
            Sequence {{ index + 1 }}
          </div>
          <div class="sequence-button-right"
               v-on:mousedown="sequenceRightDown(index)">
          </div>
        </div>
        <div class="time-spacer" ref="time-spacer">.</div>
        <div class="time-bar" ref="timeBar" v-on:mousedown="timeBarDown">
          <span class="time-indicator" ref="timeIndicator"></span>
        </div>
      </div>
      <!-- These effects are moved in mounted() -->
      <div class="all-sequences">
        <sequence-effect
          v-for="(sequence, sequenceIndex) in sequences"
          v-bind:active="selected.indexOf(sequenceIndex) != -1"
          v-bind:class="(selected.indexOf(sequenceIndex) != -1)? '': 'sequence-effects-hidden'"
          v-bind:key="'sequence-' + sequence.id"
          v-bind:ref="'sequence-effect-' + sequence.id"
          v-on:register='registerSequenceEffect'
          v-bind:index='sequenceIndex'
          v-on:ready="effectSettingsReady(sequenceIndex)"
          v-bind:initialEffectGetter="sequence.initialEffectGetter"
          v-bind:player="player"
          v-on:duration="onDuration"/>
      </div>
      <scene-template-selector ref="scene-template-selector"/>
      <div class="adder-container" v-if="dragging == null">
        <button v-on:click="addSequenceAndDrag"
                class="add-button">
          <img src="icons/feather/plus.svg" title="new sequence" width="20"/>
          New sequence
        </button><br>
        <button v-on:click="fromTemplateButton"
                class="add-button">
          <img src="icons/feather/plus.svg" title="new sequence from template" width="20"/>
          From template
        </button><br>
        <button v-on:click="deleteSelected"
                class="delete-button">
          <img src="icons/feather/trash.svg" title="new sequence from template" width="20"/>
          Delete selected
        </button>

      </div>
    </div>
  `,
  props: ["player", "scenes"],
  data: function(){
    return {
      time: {time: 0.0},
      selected: [],
      dragging: null,
      draggingBody: null,
      draggingLeft: null,
      draggingRight: null,
      draggingTimeBar: null,
      draggingTimeFrom: null,
      sequences: []
    };
  },
  methods: {
    serialize(){
      let data = [];

      for(let i = 0; i < this.sequences.length; i++){
        let seq = this.sequences[i];
        let component = this.$refs["sequence-effect-"+seq.id][0];

        data.push({
          effect: component.serialize(),
          layer: seq.layer,
          from: seq.from,
          to: seq.to
        });
      }

      return data;
    },
    unserialize(data, erase){
      if (erase) {
        this.sequences = [];
      }
      this.player.sequences = this.sequences;
      for(let i = 0; i < data.length; i++){
        this.sequences.push({
          id: utils.increment_unique_counter("sequence"),
          layer: data[i].layer || 0,
          from: data[i].from || 0,
          to: data[i].to || 1,
          effect: null,
          initialEffectGetter: function(){
            return data[i].effect;
          }
        });
      }

      this.$nextTick(this.repositionSequences);
    },
    timeBarDown(){
      this.dragging = null
      this.draggingTimeBar = true;
      this.draggingBody = false;
      this.draggingLeft = false;
      this.draggingRight = false;
      window.addEventListener("mouseup", this.unDrag.bind(this), {once: true});
      this.mouseMoveListener = this.mouseMove.bind(this);
      window.addEventListener("mousemove", this.mouseMoveListener);
    },
    sequenceBodyDown(index, e, dragFromMiddle){
      this.dragging = index;
      let [x,y,time,layer,seq,duration,scale] = this.mouseEventInfo(e);

      if(this.selected.indexOf(index) != -1){
        this.selected = this.selected.filter(function(row) {
          return row != index;
        });
      } else {
        this.selected.push(index);
      }

      this.draggingTimeBar = false;
      this.draggingBody = true;
      this.draggingLeft = false;
      this.draggingRight = false;

      if(dragFromMiddle){
        this.draggingTimeFrom = seq.from - 0.1;
      } else {
        this.draggingTimeFrom = time - seq.from;
      }

      window.addEventListener("mouseup", this.unDrag.bind(this), {once: true});
      this.mouseMoveListener = this.mouseMove.bind(this);
      window.addEventListener("mousemove", this.mouseMoveListener);
    },
    sequenceLeftDown(index){
      this.dragging = index;
      this.draggingTimeBar = false;
      this.draggingBody = false;
      this.draggingLeft = true;
      this.draggingRight = false;
      window.addEventListener("mouseup", this.unDrag.bind(this), {once: true});
      this.mouseMoveListener = this.mouseMove.bind(this);
      window.addEventListener("mousemove", this.mouseMoveListener);
    },
    sequenceRightDown(index){
      this.dragging = index;
      this.draggingTimeBar = false;
      this.draggingBody = false;
      this.draggingLeft = false;
      this.draggingRight = true;
      window.addEventListener("mouseup", this.unDrag.bind(this), {once: true});
      this.mouseMoveListener = this.mouseMove.bind(this);
      window.addEventListener("mousemove", this.mouseMoveListener);
    },
    unDrag(){
      window.removeEventListener("mousemove", this.mouseMoveListener);
      this.draggingBody = false;
      this.draggingLeft = false;
      this.draggingRight = false;
      this.draggingTimeBar = false;
      this.dragging = null;
    },
    mouseEventInfo(e){
      let scale = this.getScale();
      let seq = null;
      let duration = null;

      if(this.dragging != null){
        seq = this.sequences[this.dragging];
        duration = seq.to - seq.from;
      }

      let x = e.clientX - parseInt(this.$el.style.left);
      let y_prime = e.clientY - parseInt(this.$el.style.top);
      let h = parseInt(this.$el.clientHeight);
      let y = h - y_prime;
      let layer = Math.floor(y / scale.layerScale);
      let time = x / scale.timeScale;

      return [x,y,time,layer,seq,duration,scale];
    },
    mouseMove(e){
      let [x,y,time,layer,seq,duration,scale] = this.mouseEventInfo(e);

      // Limit to 6 (including 0)
      layer = Math.min(layer, 5);
      layer = Math.max(layer, 0);

      if(this.draggingLeft){
        // -10 to grab from center
        let initial_from = seq.from;
        seq.from = (x - 10) / scale.timeScale;
        this.repositionSequences();
        let sequence_component = this.$refs["sequence-effect-"+seq.id][0];
        let effect = sequence_component.effect;
        // Quite a hack to find video effects
        // We should find all effect components of a sequence
        if (effect.name.indexOf("video") != -1){
          sequence_component.plugin.onTrimLeft(seq.from - initial_from);
        }
      }

      if(this.draggingRight){
        // -10 to grab from center
        seq.to = (x + 10) / scale.timeScale;
        this.repositionSequences();
      }

      if(this.draggingBody){
        let newFrom = time - this.draggingTimeFrom;
        seq.from = newFrom;
        seq.to = newFrom + duration;
        seq.layer = layer;
        this.repositionSequences();
      }

      if(this.draggingTimeBar){
        let time = x / scale.timeScale;
        this.player.time.time = time;
      }
    },
    getScale(){
      let totalDuration = 63;
      let timeScale = this.$el.clientWidth / totalDuration;
      let layerScale = 25;

      return {totalDuration, timeScale, layerScale};
    },
    repositionSequences(){
      let scale = this.getScale();
      let maxTo = 0.0;
      for(let i = 0; i < this.sequences.length; i++){
        let seq = this.sequences[i];
        let els = this.$refs["sequence-"+seq.id];
        if(els == undefined || els.length == 0){
          continue;
        }
        let el = els[0];
        el.style.left = (seq.from * scale.timeScale) + "px";
        el.style.width = ((seq.to - seq.from) * scale.timeScale) + "px";
        el.style.bottom = (5 + (seq.layer) * scale.layerScale) + "px";

        if(seq.to > maxTo){
          maxTo = seq.to;
        }
      }
      // Make scroll available until 1/3 later than the last sequence
      let timeSpacer = this.$refs["time-spacer"];
      timeSpacer.style.left = (maxTo * scale.timeScale * 1.33) + "px"
    },
    fromTemplateButton(){
      let app = this;

      this.$refs['scene-template-selector'].open(function(data){
        let erase = false;
        app.unserialize(data, erase);
      });
    },
    addSequenceAndDrag(){
      this.addSequence();
      let index = this.sequences.length - 1;
      window.addEventListener("mousemove", function(e){
        this.sequenceBodyDown(index, e, true);
        this.draggingBody = true;
      }.bind(this),{
        once: true
      });
    },
    addSequence(){
      let id = utils.increment_unique_counter("sequence");
      let layer = id % 3; // Alternate layer to avoid overlapping

      this.sequences.push({
        id: id,
        layer: layer,
        from: 0,
        to: 10,
        effect: null,
      });

      this.$nextTick(this.repositionSequences);
      this.selected = [];
    },
    deleteSelected(){
      let selected = this.selected;
      this.sequences = this.sequences.filter(function(row, id){
        if(selected.indexOf(id) != -1){
          return false;
        }
        return true;
      });
      this.player.sequences = this.sequences;
      this.$nextTick(this.repositionSequences);
    },
    registerSequenceEffect(index, effect){
      // Ok we use your version of the array
      this.sequences[index].effect = effect;
    },
    onDuration(info){
      /*
         When a video is loaded
         we want to resize sequence to length of video
      */
      this.sequences[info.sequence].to =
        this.sequences[info.sequence].from +
        info.duration;

      this.repositionSequences();
    }
  },
  watch:{
    player(){
      this.player.sequences = this.sequences;
      this.player.time = this.time;
    },
    time: {
      handler(){
        let scale = this.getScale();
        function formatTime(t){
          let m = Math.floor(t / 60);
          let s = Math.floor(t % 60);
          let cs = Math.floor((t - s) * 100);
          s = (s < 10)? "0" + s: s;
          m = (m < 10)? "0" + m: m;
          cs = (cs < 10)? "0" + cs: cs;
          return m + ":" + s + ":" + cs;
        }
        // Stop user from putting time bar before 0
        if(this.time.time < 0){
          this.time.time = 0;
        }
        this.$refs["timeBar"].style.left = (this.time.time * scale.timeScale) + "px";
        this.$refs["timeIndicator"].innerHTML = formatTime(this.time.time)
      },
      deep: true
    }
  },
  mounted(){
    this.addSequence();
    this.$nextTick(this.unDrag);

    let allSequences = this.$el.querySelectorAll(".all-sequences")[0];
    let allSequencesContainer = document.querySelectorAll(".all-sequences-container")[0];

    // Select first sequence by default
    this.selected = [0];

    allSequencesContainer.appendChild(allSequences);
  }
});
