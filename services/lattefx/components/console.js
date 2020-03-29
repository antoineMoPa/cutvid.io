Vue.component('console', {
  template: `
    <div class="console" >
      <input class="console-input"
             placeholder="Search Commands"
             v-model="search_string"
             v-on:keyup="search"
             v-on:focus="on_focus"
             v-on:focusout="on_focus_out"/>
      <div class="console-result" v-if="show_console">
        <div v-for="api_element in api_results">
          <div class="api-result" v-on:mousedown="call(api_element)">
            <img src="icons/feather/corner-down-right.svg">
            <p class="api-title">{{doc_title(api_element)}}</p>
            <p class="api-doc">{{doc_content(api_element)}}</p>
          </div>
          <p class="api-name">API: {{api_element.name}}</p>
        </div>
        <div class="command-output" v-if="command_output != null">
          {{ command_output }}
        </div>
      </div>
    </div>`,
  data(){
    return {
      search_string: "",
      show_console: false,
      api_results: [],
      command_output: null
    }
  },
  props: [],
  methods: {
    on_focus(){
      this.show_console = true;
    },
    on_focus_out(e){
      this.show_console = false;
    },
    async call(api_element){
      this.search_string = "";

      let api = window.API;
      let result = api.call(api_element.name);

      if(typeof(result) == "undefined"){
        return;
      }

      await this.$nextTick();

      this.show_console = true;

      let title = this.doc_title(api_element);
      this.command_output = title + ": " + result;
      this.api_results.splice(0);

      setTimeout(function(){

      }.bind(this), 3000);

    },
    doc_title(api_element){
      return api_element.doc.split("\n")[0] || "";
    },
    doc_content(api_element){
      // Remove first line
      return api_element.doc.replace(/.*\n/,"");
    },
    search(){
      let api = window.API;
      this.api_results.splice(0);
      this.command_output = null;

      let searchFor = this.search_string.toLowerCase();

      // Bad linear search
      for(let i in api.the_api){
        let has_match = false;

        if(api.the_api[i].tags.indexOf("no-ui") != -1){
          continue;
        }

        if(i.toLowerCase().indexOf(searchFor) != -1){
          has_match = true;
        } else if (api.the_api[i].doc.toLowerCase().indexOf(searchFor) != -1){
          has_match = true;
        }

        if(has_match){
          this.api_results.push(api.the_api[i]);
        }

        if(this.api_results.length > 10){
          break;
        }
      }
    }
  },
  watch:{
  },
  mounted(){
  }
});
