Vue.component('sequencer', {
  template: `
    <div class="sequencer"
         v-on:click.self="clickSequencer">
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
            <span v-if="sequences[index].effect != null">
              {{ sequences[index].effect.human_name }}
            </span>
          </div>
          <div class="sequence-button-right"
               v-on:mousedown="sequenceRightDown(index)">
          </div>
        </div>
        <div class="time-spacer" ref="time-spacer">.</div>
        <div class="time-bar" ref="timeBar">
          <span class="time-indicator" ref="timeIndicator"></span>
        </div>
      </div>
      <!-- These effects are moved in mounted() -->
      <div class="all-sequences">
        <sequence-effect
          v-for="(sequence, sequenceIndex) in sequences"
          v-bind:active="selected[selected.length-1] == sequenceIndex"
          v-bind:class="(selected[selected.length-1] == sequenceIndex)? '': 'sequence-effects-hidden'"
          v-bind:key="'sequence-' + sequence.id"
          v-bind:ref="'sequence-effect-' + sequence.id"
          v-on:register='registerSequenceEffect'
          v-bind:index='sequenceIndex'
          v-on:ready="effectSettingsReady(sequenceIndex)"
          v-bind:initialEffectGetter="sequence.initialEffectGetter"
          v-bind:player="player"
          v-on:duration="onDuration"/>
          <p v-if="sequences.length == 0">
            Add a sequence to begin!
          </p>
          <p v-else-if="selected.length == 0">
            Select a sequence to begin!
          </p>
      </div>
      <!--
        <scene-template-selector ref="scene-template-selector"/>
      -->
      <div class="adder-container" v-if="dragging == null">
        <button v-on:click="addSequenceAndDrag"
                class="add-button">
          <img src="icons/feather/plus.svg" title="new sequence" width="20"/>
          New sequence
        </button><br>
        <!--
        <button v-on:click="fromTemplateButton"
                class="add-button">
          <img src="icons/feather/plus.svg" title="new sequence from template" width="20"/>
          From template
        </button><br>
        -->
        <button v-on:click="deleteSelected"
                class="delete-button">
          <img src="icons/feather/trash.svg" title="new sequence from template" width="20"/>
          Delete selected
        </button><br>
        <!--
        <button v-on:click="splitSelected"
                v-if="selected.length > 0"
                class="split-button">
          <img src="icons/feather/scissors.svg" title="cut sequence at selected time" width="20"/>
          Split selection
        </button>
        -->
      </div>
    </div>
  `,
  props: ["player", "scenes"],
  data: function(){
    return {
      time: {time: 0.0},
      selected: [],
      visibleDuration: 10,
      dragging: null,
      draggingBody: null,
      draggingLeft: null,
      draggingRight: null,
      draggingTimeFrom: null,
      sequences: []
    };
  },
  methods: {
    serialize(only_indexes){
      /*
         Serialize sequences

         only_indexes, if defined, is a whitelist filter
      */
      if(typeof(only_indexes) == "undefined"){
        only_indexes = null;
      }
      let data = [];

      for(let i = 0; i < this.sequences.length; i++){
        if(only_indexes != null && only_indexes.indexOf(i) == -1){
          continue;
        }
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
    splitSelected(){
      let new_sequences = [];

      for(let i in this.sequences){
        // Is this sequence selected?
        if(this.selected.indexOf(this.sequences[i].id) == -1){
          continue;
        }
        let sequence = this.sequences[i];
        let from = sequence.from;
        let to = sequence.to;
        let time = this.player.time.time;

        // If timebar is between from and to,
        // split at timebar position
        // else split in half
        if(time < from || time > to){
          time = from + (to - from) * 0.5;
        }

        if(time == 0){
          continue;
        }

        // Build second part, by serializing and unserializing
        let data = this.serialize([parseInt(i)]);
        data[0].to = sequence.to;
        data[0].from = time;
        data[0].layer = sequence.layer;

        if(data[0] == null){
          continue;
        }
        // Videos: add a trim
        if("trimBefore" in data[0].effect){
          let new_trim = time - sequence.from;
          data[0].effect.trimBefore += new_trim;
        }
        this.unserialize(JSON.parse(JSON.stringify(data)), false);

        // Finally, update initial sequence's end
        sequence.to = time;
      }
    },
    onWheel(e){
      if(e.deltaY < 0){
        this.visibleDuration -= 10;
      } else {
        this.visibleDuration += 10;
      }

      if(this.visibleDuration < 4){
        this.visibleDuration = 4;
      }

      this.time.time = this.time.time + 0.001; // hack to update the timebar
      this.repositionSequences();
    },
    clickSequencer(e){
      this.selected = [];
      let info = this.mouseEventInfo(e);
      // Move cursor to this time
      this.player.time.time = info[2];
    },
    sequenceBodyDown(index, e, dragFromMiddle){
      if(this.player != null && this.player.rendering) { return; }

      this.dragging = index;

      let [x,y,time,layer,seq,duration,scale] = this.mouseEventInfo(e);

      if(this.selected.indexOf(index) != -1){
        if(e.shiftKey) {
          this.selected = this.selected.filter(function(row) {
            return row != index;
          });
        } else {
          this.selected = [];
        }
      } else {
        if(e.shiftKey) {
          this.selected.push(index);
        } else {
          this.selected = [index];
        }
        // Move time to middle of newly selected sequence
        this.time.time = seq.from + (seq.to - seq.from) * 0.5;
      }

      this.draggingBody = true;
      this.draggingLeft = false;
      this.draggingRight = false;

      if(dragFromMiddle){
        this.draggingTimeFrom = seq.from + (seq.to - seq.from) * 0.5;
      } else {
        this.draggingTimeFrom = time - seq.from;
      }

      window.addEventListener("mouseup", this.unDrag.bind(this), {once: true});
      this.mouseMoveListener = this.mouseMove.bind(this);
      window.addEventListener("mousemove", this.mouseMoveListener);
    },
    sequenceLeftDown(index){
      if(this.player != null && this.player.rendering) { return; }

      this.dragging = index;
      this.draggingBody = false;
      this.draggingLeft = true;
      this.draggingRight = false;
      window.addEventListener("mouseup", this.unDrag.bind(this), {once: true});
      this.mouseMoveListener = this.mouseMove.bind(this);
      window.addEventListener("mousemove", this.mouseMoveListener);
    },
    sequenceRightDown(index){
      if(this.player != null && this.player.rendering) { return; }

      this.dragging = index;
      this.draggingBody = false;
      this.draggingLeft = false;
      this.draggingRight = true;
      window.addEventListener("mouseup", this.unDrag.bind(this), {once: true});
      this.mouseMoveListener = this.mouseMove.bind(this);
      window.addEventListener("mousemove", this.mouseMoveListener);
    },
    unDrag(){
      if(this.player != null && this.player.rendering) { return; }

      window.removeEventListener("mousemove", this.mouseMoveListener);
      this.draggingBody = false;
      this.draggingLeft = false;
      this.draggingRight = false;
      this.dragging = null;
    },
    mouseEventInfo(e){
      if(this.player != null && this.player.rendering) { return; }

      let scale = this.getScale();
      let seq = null;
      let duration = null;

      if(this.dragging != null){
        seq = this.sequences[this.dragging];
        duration = seq.to - seq.from;
      }

      let x = e.clientX + this.$el.scrollLeft - parseInt(this.$el.style.left);
      let y_prime = e.clientY - parseInt(this.$el.style.top);
      let h = parseInt(this.$el.clientHeight);
      let y = h - y_prime;
      let layer = Math.floor(y / scale.layerScale);
      let time = x / scale.timeScale;

      return [x,y,time,layer,seq,duration,scale];
    },
    findSnap(time){
      /*
        Find things close to "time":

         - sequence that end/start close to time
         - 0

        (except currently dragged sequences)
      */

      let delta = 0.005 * this.visibleDuration; // in second
      for(let i = 0; i < this.sequences.length; i++){
        let seq = this.sequences[i];
        if(this.dragging == i){
          continue;
        }
        if(Math.abs(seq.from - time) < delta){
          return seq.from;
        }
        if(Math.abs(seq.to - time) < delta){
          return seq.to;
        }
      }

      // Snap to 0
      if(Math.abs(time - 0) < delta){
        return 0;
      }

      return null;
    },
    mouseMove(e){
      if(this.player != null && this.player.rendering) { return; }

      let [x,y,time,layer,seq,duration,scale] = this.mouseEventInfo(e);

      // Limit to 6 (including 0)
      layer = Math.min(layer, 5);
      layer = Math.max(layer, 0);

      if(this.draggingLeft){
        // -10 to grab from center
        let initial_from = seq.from;
        seq.from = (x - 10) / scale.timeScale;

        let snap = this.findSnap(seq.from);
        if(snap != null){
          seq.from = snap;
        }

        this.repositionSequences();
        let sequence_component = this.$refs["sequence-effect-"+seq.id][0];
        let effect = sequence_component.effect;

        if (sequence_component.plugin != undefined){
          if (sequence_component.plugin.onTrimLeft != undefined){
            sequence_component.plugin.onTrimLeft(seq.from - initial_from);
          }
        }
      }

      if(this.draggingRight){
        // -10 to grab from center
        seq.to = (x + 10) / scale.timeScale;

        let snap = this.findSnap(seq.to);
        if(snap != null){
          seq.to = snap;
        }

        this.repositionSequences();
      }

      if(this.draggingBody){
        let newFrom = time - this.draggingTimeFrom;
        seq.from = newFrom;
        seq.to = newFrom + duration;
        seq.layer = layer;
        this.repositionSequences();
      }
    },
    getScale(){
      let totalDuration = this.visibleDuration;
      let timeScale = this.$el.clientWidth / totalDuration;
      let layerScale = 25;

      return {totalDuration, timeScale, layerScale};
    },
    repositionSequences(){
      if(this.player != null && this.player.rendering) { return; }

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
      if(this.player != null && this.player.rendering) { return; }

      let app = this;

      this.$refs['scene-template-selector'].open(function(data){
        let erase = false;
        app.unserialize(data, erase);
      });
    },
    addSequenceAndDrag(){
      if(this.player != null && this.player.rendering) { return; }

      this.addSequence();
      let index = this.sequences.length - 1;
      window.addEventListener("mousemove", function(e){
        this.sequenceBodyDown(index, e, true);
        this.draggingBody = true;
      }.bind(this),{
        once: true
      });
      fetch("/stats/lattefx_app_add_sequence/");
    },
    addSequence(){
      if(this.player != null && this.player.rendering) { return; }

      let id = utils.increment_unique_counter("sequence");
      let layer = id % 3; // Alternate layer to avoid overlapping

      this.sequences.push({
        id: id,
        layer: layer,
        from: 0,
        to: this.visibleDuration * 0.2,
        effect: null,
      });

      this.$nextTick(this.repositionSequences);
      this.selected = [];
    },
    deleteSelected(){
      if(this.player != null && this.player.rendering) { return; }

      let selected = this.selected;
      this.sequences = this.sequences.filter(function(row, id){
        if(selected.indexOf(id) != -1){
          return false;
        }
        return true;
      });
      this.player.sequences = this.sequences;
      this.$nextTick(this.repositionSequences);
      fetch("/stats/lattefx_app_delete_sequence/");
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
    },
    bindShortcuts(){
      let app = this;
      window.addEventListener("keydown", (e) => {
        if(app.player != null && app.player.rendering) { return; }

        if(e.key == "a"){
          if(e.ctrlKey){
            e.preventDefault();
            this.selected = [];
            for(let i = 0; i < this.sequences.length; i++){
              this.selected.push(i);
            }
            return false;
          }
        }
        if(e.key == "ArrowLeft"){
          app.time.time -= 0.008 * app.visibleDuration;
        }
        if(e.key == "ArrowRight"){
          app.time.time += 0.008 * app.visibleDuration;
        }
        if(e.key == "Delete"){
          app.deleteSelected();
        }
      });
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
          return m + "m" + s + "s" + cs;
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
    this.$nextTick(this.unDrag);

    let allSequences = this.$el.querySelectorAll(".all-sequences")[0];
    let allSequencesContainer = document.querySelectorAll(".all-sequences-container")[0];

    this.$el.addEventListener("wheel", this.onWheel);

    // Select first sequence by default
    this.selected = [0];

    allSequencesContainer.appendChild(allSequences);

    this.bindShortcuts();
  }
});
