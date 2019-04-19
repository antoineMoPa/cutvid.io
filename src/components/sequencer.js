Vue.component('sequencer', {
  template: `
    <div class="sequencer">
      <div v-for="(sequence, index) in sequences" class="sequence" v-bind:ref="'sequence-'+index">
        <div class="sequence-button-left"
             v-on:mousedown="sequenceLeftDown(index)">
        </div>
        <div class="sequence-body"
             v-on:mousedown="sequenceBodyDown(index)">
          sequence
        </div>
        <div class="sequence-button-right"
             v-on:mousedown="sequenceRightDown(index)">
        </div>
      </div>
      <div class="time-bar" ref="timeBar" v-on:mousedown="timeBarDown"></div>
      <!-- These effects are moved in mounted() -->
      <div class="all-sequences">
        <sequence-effects v-for="(sequence, sequenceIndex) in sequences"
          v-bind:active="sequence.selected"
          v-bind:class="(sequence.selected)? '': 'sequence-effects-hidden'"
          v-bind:key="'sequence-' + sequence.id"
          v-bind:ref="'sequence-' + sequence.id"
          v-on:ready="effectsSettingsReady(sequenceIndex)"
          v-bind:effects="sequence.effects"
          v-bind:player="player"/>
      </div>
    </div>
  `,
  props: ["player"],
  data: function(){
    return {
      time: {time: 0.0},
      selected: null,
      dragging: null,
      draggingBody: null,
      draggingLeft: null,
      draggingRight: null,
      draggingTimeBar: null,
      sequences: [{
        id: utils.increment_unique_counter("sequence"),
        selected: true,
        layer: 0,
        from: 0,
        to: 3,
        effects: [],
      }]
    };
  },
  methods: {
    serialize(){
      let data = {};

      for(let i = 0; i < this.sequences.length; i++){
        let component = this.$refs['sequence-effects-' + scene.id][0];

        data.push({
          effects: component.serialize(),
          duration:  scene.duration
        });

        return "{}";
      }
    },
    unserialize(data){
      for(let i = 0; i < data; i++){
        this.sequences.push(data);
      }
      this.repositionSequences();
    },
    timeBarDown(){
      this.player.pause();
      this.dragging = null
      this.draggingTimeBar = true;
      this.draggingBody = false;
      this.draggingLeft = false;
      this.draggingRight = false;
      window.addEventListener("mouseup", this.unDrag.bind(this), {once: true});
      this.mouseMoveListener = this.mouseMove.bind(this);
      window.addEventListener("mousemove", this.mouseMoveListener);
    },
    sequenceBodyDown(index){
      this.dragging = index;
      this.draggingTimeBar = false;
      this.draggingBody = true;
      this.draggingLeft = false;
      this.draggingRight = false;
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
    },
    mouseMove(e){
      let scale = this.getScale();
      let seq = this.sequences[this.dragging];
      let x = e.clientX - parseInt(this.$el.style.left);
      let y_prime = e.clientY - parseInt(this.$el.style.top);
      let h = parseInt(this.$el.clientHeight);
      let y = h - y_prime;
      let layer = Math.floor(y / scale.layerScale);

      // Limit to 6 (including 0)
      layer = Math.min(layer, 5);
      layer = Math.max(layer, 0);

      if(this.draggingLeft){
        // -10 to grab from center
        seq.from = (x - 10) / scale.timeScale;
        this.repositionSequences();
      }

      if(this.draggingRight){
        // -10 to grab from center
        seq.to = (x - 10) / scale.timeScale;
        this.repositionSequences();
      }

      if(this.draggingBody){
        let duration = seq.to - seq.from;
        // + duration/2 to grab from center
        let newFrom = x / scale.timeScale - duration/2;
        seq.from = newFrom;
        seq.to = newFrom + duration;
        seq.layer = layer;
        this.repositionSequences();
      }

      if(this.draggingTimeBar){
        let time = x / scale.timeScale;
        this.player.time.time = time;
        this.player.draw_gl(time);
      }
    },
    getScale(){
      let totalDuration = 10;
      let timeScale = this.$el.clientWidth / totalDuration;
      let layerScale = 25;

      return {totalDuration, timeScale, layerScale};
    },
    repositionSequences(){
      let scale = this.getScale();
      for(let i = 0; i < this.sequences.length; i++){
        let seq = this.sequences[i];
        let el = this.$refs["sequence-"+seq.id][0];

        el.style.left = (seq.from * scale.timeScale) + "px";
        el.style.width = ((seq.to - seq.from) * scale.timeScale) + "px";
        el.style.bottom = (5 + (seq.layer) * scale.layerScale) + "px";
      }
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
        this.$refs["timeBar"].style.left = (this.time.time * scale.timeScale) + "px";
      },
      deep: true
    }
  },
  mounted(){
    this.repositionSequences();

    let allSequences = this.$el.querySelectorAll(".all-sequences")[0];
    let allSequencesContainer = document.querySelectorAll(".all-sequences-container")[0];

    allSequencesContainer.appendChild(allSequences);
  }
});
