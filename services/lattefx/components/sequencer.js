Vue.component('sequencer', {
  template: `
    <div class="sequencer">
      <div class="sequencer-loading"
           v-if="loading_scene">
        <p>
          loading scene
        </p>
      </div>
      <div class="sequencer-scrollbox"
        v-on:click.self="clickSequencer"
        v-on:mouseenter="mouseover = true"
        v-on:mouseleave="mouseover = false">
        <div class="sequencer-height-dragger"
             v-on:mousedown="height_dragger_down"
             v-on:mouseup="height_dragger_up">
        </div>
        <div class="add-menu">
          <button class="more-suggestion suggestion"
                  v-if="!add_menu_open"
                  v-on:click="add_menu_open = true">
            <img src="icons/feather/plus.svg" class="feather-icon" width="20"/>
            Add
          </button>
          <button class="more-suggestion suggestion close-button"
                  v-else
                  v-on:click="add_menu_open = false">
            <img src="icons/feather/x.svg" class="feather-icon" width="20"/>
            Close
          </button>
          <button class="more-suggestion suggestion"
                v-if="add_menu_open"
                v-on:click="quick_add_sequence('video')">
            <img src="icons/feather/film.svg" class="feather-icon" width="20"/>
            Video
          </button>
          <button class="more-suggestion suggestion"
                  v-if="add_menu_open"
                  v-on:click="quick_add_sequence('audio')">
            <img src="icons/feather/music.svg" class="feather-icon" width="20"/>
            Audio
          </button>
          <button class="more-suggestion suggestion"
                  v-if="add_menu_open"
                  v-on:click="quick_add_sequence('image')">
            <img src="icons/feather/image.svg" class="feather-icon" width="20"/>
            Image
          </button>
          <button class="more-suggestion suggestion"
                  v-if="add_menu_open"
                  v-on:click="quick_add_sequence('canvas')">
            <img src="icons/feather/edit.svg" class="feather-icon" width="20"/>
            Canvas
          </button>
          <button class="more-suggestion suggestion"
                  v-if="add_menu_open"
                  v-on:click="quick_add_sequence(null)">
            <img src="icons/feather/plus.svg" class="feather-icon" width="20"/>
            Other
          </button>
        </div>
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
      <!-- These effects are moved in mounted() -->
      <div class="all-sequences">
        <sequence-effect
          v-for="(sequence, sequenceIndex) in sequences"
          v-bind:active="selected.length > 0 && selected[selected.length-1] == sequenceIndex && sequence.from <= time.time && sequence.to >= time.time"
          v-bind:class="(selected.length > 0 && selected[selected.length-1] == sequenceIndex && sequence.from <= time.time && sequence.to >= time.time)? '': 'sequence-effects-hidden'"
          v-bind:key="'sequence-' + sequence.id"
          v-bind:ref="'sequence-effect-' + sequence.id"
          v-on:register='registerSequenceEffect'
          v-bind:index='sequenceIndex'
          v-on:ready="effectSettingsReady(sequenceIndex)"
          v-bind:initialEffectGetter="sequence.initialEffectGetter"
          v-bind:initialEffectName="sequence.initialEffectName"
          v-bind:player="player"
          v-on:duration="onDuration"/>
          <p v-if="sequences.length == 0">
            Add a sequence to begin!
          </p>
          <p v-else-if="selected.length == 0">
            Select a sequence to begin!
          </p>
        </div>
      </div>

      <div class="sequencer-buttons-container" v-if="dragging == null">
        <button v-on:click="split_at_cursor"
                class="split-button">
          <img src="icons/feather/scissors.svg" title="cut sequence at selected time" width="20"/>
          Split at cursor
        </button>
        <button v-on:click="deleteSelected"
                v-if="selected.length > 0"
                class="delete-button">
          <img src="icons/feather/trash.svg" width="20"/>
          Delete selected
        </button>
        <button v-on:click="zoom_in()" class="tool-button" title="shortcut: Shift + Mousewheel">
          <img src="icons/feather/plus.svg" width="20"/>
          Zoom in
        </button>
        <button v-on:click="zoom_out()" class="tool-button" title="shortcut: Shift + Mousewheel">
          <img src="icons/feather/minus.svg" width="20"/>
          Zoom out
        </button>
        <!--
        Templates were too ugly and few
        <button v-on:click="launch_template_selector()"
                class="add-button">
          <img src="icons/feather/plus.svg" title="new sequence from template" width="20"/>
          Templates
        </button>
        -->
      </div>
      <scene-template-selector
        ref="scene-template-selector"
        v-on:start_loading="loading_scene = true"/>
      <effects-selector ref="effectSelector"/>
    </div>
  `,
  props: ["player", "scenes"],
  data: function(){
    return {
      time: {time: 0.0},
      selected: [],
      visibleDuration: 10,
      add_menu_time: 0,
      add_menu_layer: 0,
      mouseover: false,
      has_moved: false,                /* Used to detect if mouse has moved
                                          after clicking body */
      dragging_height: false,
      dragging: null,
      draggingBody: null,
      draggingLeft: null,
      draggingRight: null,
      draggingTimeFrom: null,
      clipboard: null,
      offset_y: 0,
      loading_scene: false,
      add_menu_open: false,
      dragging_selected: null,
      sequences: []
    };
  },
  methods: {
    expose(){
      let API = window.API;

      API.expose({
        name: "sequencer.get_total_duration",
        doc: `Get total duration (seconds)

        Total duration (in seconds) starts from 0 and goes to the
        end of the last sequence.
        `,
        fn: function(){
          return this.get_total_duration();
        }.bind(this)
      });

      API.expose({
        name: "sequencer.get_cost",
        doc: `Get cost in render credits

        `,
        fn: function(){
          let duration = this.get_total_duration();
          let cost = parseInt(duration / 60) + 1;
          return cost;
        }.bind(this)
      });

      API.expose({
        name: "sequencer.select_all_after_cursor",
        doc: `Select all sequences after cursor

        `,
        fn: function(){
          this.select_all_after_cursor();
        }.bind(this)
      });

      API.expose({
        name: "sequencer.select_all_before_cursor",
        doc: `Select all sequences before cursor
        `,
        fn: function(){
          this.select_all_before_cursor();
        }.bind(this)
      });

      API.expose({
        name: "sequencer.select_none",
        doc: `Unselect every sequence
        `,
        fn: function(){
          this.select_none();
        }.bind(this)
      });

      API.expose({
        name: "sequencer.split_at_cursor",
        doc: `Split at cursor
        `,
        fn: function(){
          this.split_at_cursor();
        }.bind(this)
      });

      API.expose({
        name: "sequencer.get_active_sequence",
        doc: `Get Active Sequence
        `,
        fn: function(){
          return this.sequences[this.selected[selected.length-1]];
        }.bind(this),
        tags: ["no-ui"]
      });
    },
    async quick_add_sequence(type){
      // Add at minimum 0
      // Else add after last video, but with some overlap to
      // create room for a transition
      let add_at = this.add_menu_time;
      let add_layer = this.add_menu_layer;

      if(type == null){
        // Pick from plugins list
        await this.$refs['effectSelector'].open(function(effectName){
          this.addSequence(effectName, add_at, add_layer);
        }.bind(this));
      } else {
        this.addSequence(type, add_at, add_layer);
      }

      await this.$nextTick();

      // Go to sequence begin
      let index = this.sequences.length - 1;
      this.time.time = this.sequences[index].from;
      // Select it
      this.selected = [index];

      this.add_menu_open = false;
    },
    copy(){
      this.clipboard = this.serialize(this.selected);

      for(let i in this.clipboard){
        this.clipboard[i].layer += 1;
      }

      // Erase after some time
      setTimeout(function(){
        this.clipboard = null;
      }.bind(this), 20000);
    },
    paste(){
      if(this.clipboard != null){
        this.unserialize(this.clipboard, false);
      }

    },
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
          to: seq.to,
          texture_urls: seq.texture_urls,
          saved_uniforms: seq.saved_uniforms
        });
      }

      return data;
    },
    unserialize(data, erase){
      let time_offset = 0;
      if (erase) {
        this.sequences = [];
      }

      this.player.sequences = this.sequences;
      for(let i = 0; i < data.length; i++){
        this.sequences.push({
          id: utils.increment_unique_counter("sequence"),
          layer: data[i].layer || 0,
          from: data[i].from + time_offset|| 0,
          to: data[i].to + time_offset || 1,
          effect: null,
          initialEffectGetter: function(){
            return data[i].effect;
          }
        });
      }

      this.$nextTick(this.repositionSequences);
    },
    split_at_cursor(){
      let new_sequences = [];

      for(let i in this.sequences){
        let sequence = this.sequences[i];
        let from = sequence.from;
        let to = sequence.to;
        let time = this.player.time.time;

        // If timebar is between from and to,
        // split at timebar position
        // else skip
        if(time <= from || time >= to){
          continue;
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

        if(data[0].effect != null){
          // Videos: add a trim
          if("trimBefore" in data[0].effect){
            let new_trim = time - sequence.from;
            data[0].effect.trimBefore += new_trim;
          }
        }

        this.unserialize(JSON.parse(JSON.stringify(data)), false);

        // Finally, update initial sequence's end
        sequence.to = time;
      }
    },
    zoom_in(){
      let go_to = this.time.time;

      this.visibleDuration -= 0.2 * this.visibleDuration;
      this.time.time = this.time.time + 0.001; // hack to update the timebar

      if(this.visibleDuration < 1){
        this.visibleDuration = 1;
      }

      this.center_time(go_to);

      this.repositionSequences();
    },
    zoom_out(){
      let go_to = this.time.time;

      this.visibleDuration += 0.2 * this.visibleDuration;
      this.time.time = this.time.time + 0.001; // hack to update the timebar

      this.center_time(go_to);

      this.repositionSequences();
    },
    center_time(go_to){
      let scrollbox = this.$el.querySelectorAll(".sequencer-scrollbox")[0];
      let scale = this.getScale();
      let center = scale.timeScale * go_to;
      let go_to_px = center - scale.totalDuration * scale.timeScale / 2;
      scrollbox.scrollLeft = parseInt(go_to_px);
    },
    onWheel(e){
      e.stopPropagation();
      if(!e.shiftKey){
        if(e.deltaY < 0){
          this.offset_y -= 10;
        } else {
          this.offset_y += 10;
        }
        this.repositionSequences();
      } else {
        e.stopPropagation();
        if(e.deltaY < 0){
          this.zoom_in(e);
        } else {
          this.zoom_out(e);
        }
      }
    },
    clickSequencer(e){
      let info = this.mouseEventInfo(e);
      let time = info[2];

      // Move cursor to this time
      this.player.time.time = time;
      this.add_menu_time = time;

      this.recalculate_layer_add_menu();
      this.add_menu_open = false;
    },
    recalculate_layer_add_menu(){
      let time = this.player.time.time;

      // Find number of layers at current time
      let max_layer = 0;
      for(let i in this.sequences){
        if (this.sequences[i].from - 0.06 * this.visibleDuration > time) {
          continue;
        }
        if (this.sequences[i].to < time) {
          continue;
        }
        max_layer = Math.max(max_layer, this.sequences[i].layer + 1);
      }

      this.add_menu_layer = max_layer;

      this.repositionSequences();

    },
    sequenceBodyDown(index, e, dragFromMiddle){
      if(this.player != null && this.player.rendering) { return; }

      this.has_moved = false;
      this.dragging = index;

      this.dragging = index;
      this.dragging_selected = this.selected.slice();

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
          this.dragging_selected = [index];
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
    height_dragger_up(){
      this.dragging_height = false;
    },
    height_dragger_down(e){
      this.dragging_height = true;
      this.initial_y = e.clientY;
      this.initial_height = parseInt(this.$el.style.height);

      window.addEventListener("mouseup", this.unDrag.bind(this), {once: true});
      this.mouseMoveListener = this.mouseMove.bind(this);
      window.addEventListener("mousemove", this.mouseMoveListener);
    },
    unDrag(e){
      if(this.player != null && this.player.rendering) { return; }

      window.removeEventListener("mousemove", this.mouseMoveListener);

      if(this.dragging != null && this.has_moved){
        this.selected = [this.dragging];
      }

      this.draggingBody = false;
      this.draggingLeft = false;
      this.draggingRight = false;
      this.dragging = null;
      this.dragging_height = false;

      if(this.dragging_selected != null && this.has_moved){
        this.selected  = this.dragging_selected.slice();
        this.dragging_selected = null;
      }
    },
    mouseEventInfo(e){
      if(this.player != null && this.player.rendering) { return; }

      let scale = this.getScale();
      let seq = null; // Single sequence
      let duration = null;

      if (this.dragging != null){
        seq = this.sequences[this.dragging];
        duration = seq.to - seq.from;
      }

      let scrollbox = this.$el.querySelectorAll(".sequencer-scrollbox")[0];

      let x = e.clientX + scrollbox.scrollLeft - parseInt(this.$el.style.left);
      let y_prime = e.clientY - parseInt(this.$el.style.top);
      let h = parseInt(this.$el.clientHeight);
      let y = h - y_prime - this.offset_y;
      let layer = Math.floor(y / scale.layerScale + 1.0);
      let time = x / scale.timeScale;

      return [x,y,time,layer,seq,duration,scale];
    },
    findSnap(time){
      /*
        Find things close to "time":

         - sequence that end/start close to time
         - 0


        Returns the lowest of close element to avoid glitching
        (except currently dragged sequences)

        Returns null if no snap is found
      */

      // Fix negative times glitch
      time = Math.max(time, 0.0);
      let delta = 0.005 * this.visibleDuration; // in second
      let smallest = null;

      for(let i = 0; i < this.sequences.length; i++){
        let seq = this.sequences[i];
        if(this.dragging == i){
          continue;
        }
        if(Math.abs(seq.from - time) < delta && (smallest == null || smallest > seq.from)){
          smallest = seq.from;
        }
        if(Math.abs(seq.to - time) < delta && (smallest == null || smallest > seq.to)){
          smallest = seq.to;
        }
      }

      // Snap to 0
      if(Math.abs(time - 0) < delta){
        smallest = 0;
      }

      return smallest;
    },
    mouseMove(e){
      this.has_moved = true;

      if(this.player != null && this.player.rendering) { return; }

      let [x,y,time,layer,seq,duration,scale] = this.mouseEventInfo(e);

      // Limit to 21 (including 0)
      layer = Math.min(layer, 20);
      layer = Math.max(layer, 0);

      if(this.dragging_height){
        this.resize(this.initial_y - e.clientY + this.initial_height);
      }

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
        let diff = time - seq.from - this.draggingTimeFrom;
        let layer_diff = layer - seq.layer;
        let seqs = this.dragging_selected;
        let snap = this.findSnap(seq.from + diff);

        if(snap != null){
          diff = snap - seq.from;
        }

        if(seqs.indexOf(this.dragging) == -1){
          seqs.push(this.dragging);
        }

        for(let i in seqs){
          let s = this.sequences[seqs[i]];

          s.from = s.from + diff;
          s.to = s.to + diff;
          s.layer = s.layer + layer_diff;
        }

        this.repositionSequences();
      }
    },
    getScale(){
      let totalDuration = this.visibleDuration;
      let timeScale = this.$el.clientWidth / totalDuration;
      let layerScale = 25;

      return {totalDuration, timeScale, layerScale};
    },
    get_total_duration(){
      let maxTo = 0.0;
      for(let i = 0; i < this.sequences.length; i++){
        let seq = this.sequences[i];
        if(seq.to > maxTo){
          maxTo = seq.to;
        }
      }
      return maxTo;
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

        el.classList.remove("sequence-small");

        if(seq.to - seq.from < 50/scale.timeScale){
          el.classList.add("sequence-small");
        }

        el.style.left = (seq.from * scale.timeScale) + "px";
        el.style.width = ((seq.to - seq.from) * scale.timeScale) + "px";
        el.style.bottom = (5 + (seq.layer) * scale.layerScale + this.offset_y) + "px";

        if(seq.to > maxTo){
          maxTo = seq.to;
        }
      }
      // Make scroll available until 1/3 later than the last sequence
      let timeSpacer = this.$refs["time-spacer"];
      timeSpacer.style.left = (maxTo * scale.timeScale * 1.33) + "px"

      let add_menu = this.$el.querySelectorAll(".add-menu")[0];

      // 3 pixels prevents unwanted clicks on menu when
      // clicking sequencer to move time bar
      add_menu.style.left = (3 + this.add_menu_time * scale.timeScale) + "px";
      add_menu.style.bottom = (5 +
                               this.add_menu_layer * scale.layerScale +
                               this.offset_y) + "px";
    },
    resize(height){
      height = (height || 200) + "px";

      this.$el.style.height = height;
      // Scrollbox
      this.$el.children[0].style.maxHeight = height;
      this.$el.children[0].style.height = height;

      this.$emit("resize");
    },
    launch_template_selector(){
      if(this.player != null && this.player.rendering) { return; }

      let app = this;

      this.$refs['scene-template-selector'].open(async function(data){
        let erase = false;
        app.loading_scene = true;
        await app.$nextTick();

        let duration = this.get_total_duration();

        for (let i = 0; i < data.length; i++){
          data[i].from += duration;
          data[i].to += duration;
        }

        app.unserialize(data, erase);
        setTimeout(function(){
          app.loading_scene = false;
        },1000);
      }.bind(this));
    },
    addSequenceAndDrag(){
      if(this.player != null && this.player.rendering) { return; }
      let app = this;
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
    addSequence(effectName, from, layer){
      if(this.player != null && this.player.rendering) { return; }
      effectName = effectName || null;
      from = from || 0.0;
      let id = utils.increment_unique_counter("sequence");
      layer = layer || id % 3; // Alternate layer to avoid overlapping

      this.sequences.push({
        id: id,
        layer: layer,
        from: from,
        to: from + this.visibleDuration * 0.2,
        initialEffectName: effectName,
        effect: null
      });

      this.$nextTick(this.repositionSequences);
      this.selected = [];

      let API = window.API;
      API.call("player.panel.switch_to_effect_settings");

      this.recalculate_layer_add_menu();
    },
    deleteSelected(){
      let app = this;
      if(this.player != null && this.player.rendering) { return; }

      let selected = this.selected;
      this.sequences = this.sequences.filter(function(row, id){
        if(selected.indexOf(id) != -1){
          let component = app.$refs["sequence-effect-"+id];

          if(typeof(component) != "undefined"){
            component = component[0];
            if(typeof(component) != "undefined"){
              component.$destroy();
            }
          }

          return false;
        }
        return true;
      });
      this.player.sequences = this.sequences;
      this.player.clear_transparent();
      this.$nextTick(this.repositionSequences);
      this.selected = [];
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

      // It would be bright to unzoom
      // to fit the video in the screen
      // With a bit more time so we can see the controls at the right
      this.visibleDuration = Math.max(this.visibleDuration, info.duration * 1.1);
      // # tiny thoughts for my users

      this.repositionSequences();
    },
    select_all(){
      this.selected = [];

      for(let i = 0; i < this.sequences.length; i++){
        this.selected.push(i);
      }
    },
    select_none(){
      this.selected = [];
    },
    select_all_after_cursor(){
      this.selected = [];

      for(let i = 0; i < this.sequences.length; i++){
        if(this.sequences[i].from > this.time.time){
          this.selected.push(i);
        }
      }
    },
    select_all_before_cursor(){
      this.selected = [];

      for(let i = 0; i < this.sequences.length; i++){
        if(this.sequences[i].to < this.time.time){
          this.selected.push(i);
        }
      }
    },
    select_inverse(){
      let old_selected = JSON.parse(JSON.stringify(this.selected));
      this.selected = [];

      for(let i = 0; i < this.sequences.length; i++){
        if(old_selected.indexOf(i) == -1){
          this.selected.push(i);
        }
      }
    },
    bindShortcuts(){
      let app = this;
      window.addEventListener("keydown", (e) => {
        if(e.key == "s"){
          if(e.ctrlKey){
            e.preventDefault();
            e.stopPropagation();
            window.player.save_video();
          }
        }

        // Skip next actions if mouse is not over sequencer
        if(!app.mouseover){
          // CTRL+a globally is not nice outside sequencer
          if(e.key == "a" && e.ctrlKey){
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        if(app.player != null && app.player.rendering) { return; }

        if(e.key == "a"){
          if(e.ctrlKey){
            e.preventDefault();
            e.stopPropagation();
            this.select_all();
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
          // We have to find a better solution for this
          // because if we hit "delete" while editing text,
          // it erases selected sequences.
          // app.deleteSelected();
        }
        if(e.key == "c"){
          if(e.ctrlKey){
            app.copy();
          }
        }
        if(e.key == "v"){
          if(e.ctrlKey){
            if(!app.mouseover){
              return;
            }
            app.paste();
          }
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
          if(isNaN(t)){
            return "00m00s00";
          }

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
        this.$refs["timeIndicator"].innerHTML = formatTime(this.time.time);
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
    this.selected = [];

    allSequencesContainer.appendChild(allSequences);

    this.bindShortcuts();
    this.repositionSequences();
    this.resize();
    this.expose();
  }
});
