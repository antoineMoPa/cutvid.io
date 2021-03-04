Vue.component('panel-selector', {
  template: `
  <div class="panel-selector">
    <div v-for="(name, i) in panelNames"
         v-on:click="switch_to(i)"
         v-bind:class="'panel-tab-header' + ' ' + (selected == i? 'selected-tab-header': '')">
      {{ name }}
    </div>
  </div>`,
  data(){
    return {
      selected: 0,
    };
  },
  props: ["panelNames"],
  methods: {
    switch_to(i){
      this.selected = i;
      this.$emit("switch", i);
    }
  }
});
