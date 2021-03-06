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
        <div class="command-output" v-if="command_output != null">
          {{ command_output }}
        </div>
        <div v-for="api_element in api_results">
          <div class="api-result" v-on:mousedown="call(api_element)">
            <img src="icons/feather/corner-down-right.svg">
            <p class="api-title">{{doc_title(api_element)}}</p>
            <pre class="api-doc">{{doc_content(api_element)}}</pre>
          </div>
          <p class="api-name">
            <span v-if="api_element.dev_only" class="api-tag">
              dev only
            </span>
            <span v-if="api_element.no_ui" class="api-tag">
              no ui
            </span>
            API: {{api_element.name}}
          </p>
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
      this.search();
    },
    on_focus_out(e){
      // You can comment this when styling the component
      this.show_console = false;
    },
    async call(api_element){
      let api = window.API;
      let result;

      if(api_element.no_ui){
        result = "Cannot this method from UI.";
      } else {
        result = api.call(api_element.name);
      }

      if(api_element.no_ui && api_element.dev_only){
        console.warning("No need to set dev_only if you set no_ui. (${api_element})");
      }

      if(typeof(result) == "undefined"){
        return;
      }

      await this.$nextTick();

      this.show_console = true;

      let title = this.doc_title(api_element);

      if(typeof(result) == "object"){
        let output = [];

        for(let item in result){
          output.push(item + " : " + result[item]);
        }
        this.command_output = output.join(", ");
      } else {
        this.command_output = title + ": " + result;
      }


      setTimeout(function(){
        this.command_output = "";
        this.show_console = false;
      }.bind(this), 1500);
    },
    doc_title(api_element){
      return api_element.doc.split("\n")[0] || "";
    },
    doc_content(api_element){
      // Remove first line
      let doc = api_element.doc.replace(/.*\n/,"");

      // Replace begining indent
      return doc.replace(/ +/g, " ");
    },
    index(){
      let api = window.API;

      this.api_results.splice(0);

      // Show and an index of functions
      // Indexed by title (first line of doc)
      let values = Object.values(window.API.the_api).filter(a => a.no_ui != true);
      this.api_results = values.sort((a,b) => a.doc > b.doc);
    },
    search(){
      if(this.search_string == ""){
        this.index();
        return;
      }

      let api = window.API;

      this.show_console = true;
      this.api_results.splice(0);
      this.command_output = null;

      let searchFor = this.search_string.toLowerCase();
      let local = window.location.href.indexOf("127.0.0.1") != -1;

      // Bad linear search
      for(let i in api.the_api){
        let has_match = false;

        if(api.the_api[i].no_ui && !local){
          continue;
        }

        if(api.the_api[i].dev_only && !local){
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
    window.addEventListener("keyup", function(e){
      if(e.key == "Escape"){
        this.show_console = false;
      }
    }.bind(this));
  }
});
