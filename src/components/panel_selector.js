Vue.component('panel-selector', {
  template: `
  <div class="panel-selector">
    <div v-for="(name, i) in panelNames"
         v-on:click="switch_to(i)"
         v-bind:class="'panel-bullet' + ' ' + (selected == i? 'selected-bullet': '')">
      {{ name }}
    </div>
  </div>`,
  data(){
    return {
	  panelNames: ["Video", "Scene", "Effects"],
      selected: 0,
    };
  },
  methods: {
    switch_to(i){
      this.selected = i;
      this.$emit("switch", i);
    }
  }
});
