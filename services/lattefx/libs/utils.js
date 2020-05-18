var utils = {};

(function(){
  let API = window.API;

  // Tool to load google webfonts with title
  utils.loaded_gfonts = {};

  utils.file_to_base64 = async function (file) {
    /* Reverse operation: just use fetch */
    return new Promise((resolve, reject) => {
      // Thanks SO: https://stackoverflow.com/questions/36280818/
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  utils.load_gfont = function(name_in, size, text){
    // Was font already loaded
    if(utils.loaded_gfonts[name_in] != undefined){
      return utils.loaded_gfonts[name_in];
    }

    return utils.loaded_gfonts[name_in] = new Promise(function(resolve, reject) {
      // Format name
      var name = name_in.replace(" ","+");
      var url = "https://fonts.googleapis.com/css?family="+name;

      var l = document.createElement("link");

      // Add attributes
      l.setAttribute("rel", "stylesheet");
      l.setAttribute("href", url);
      document.head.appendChild(l);

      let fakeDiv = document.createElement("div");
      fakeDiv.innerHTML = "<span style='font-family:" + name_in + ";'>Loading font - " + name_in + "</span>";

      document.body.appendChild(fakeDiv);

      l.onload = function(){
        if("fonts" in document){
          document.fonts.load(size + "px " + name_in, text).then(function(){
            fakeDiv.parentNode.removeChild(fakeDiv);
            resolve();
          });
        } else {
          // Set as loaded
          fakeDiv.parentNode.removeChild(fakeDiv);
        }
      };
    });
  }

  // Tool for dynamic script loading

  utils.scripts = [];
  utils.randurl_param = "?" + Math.random();

  utils.load_script = async function(url, callback){
    return new Promise(function (resolve, reject) {
      // Already loaded?
      if(url in utils.scripts){
        if(utils.scripts[url].ready){
          if(callback != undefined){
            callback();
          }
          resolve();
        } else {
          if(callback != undefined){
            utils.scripts[url].callbacks.push(callback);
          }
          utils.scripts[url].promises.push(resolve);
        }

        return;
      }

      utils.scripts[url] = {ready: false, callbacks: [], promises: []};

      let script = document.createElement("script");

      script.onload = function(){
        // Call callbacks and resolve()'s
        // to inform that script is loaded
        if(callback != undefined){
          utils.scripts[url].callbacks.push(callback);
        }

        utils.scripts[url].promises.push(resolve);
        utils.scripts[url].ready = true;

        let cbs = utils.scripts[url].callbacks;
        cbs.forEach((cb) => {cb()});

        let promises = utils.scripts[url].promises;
        promises.forEach((resolve) => {resolve()});
      };

      script.src = url + utils.randurl_param;
      document.body.appendChild(script);
    });
  }

  utils.plugins = {};


  utils.unique_counters = {};

  // TODO: Set default value when loading back scenes

  utils.increment_unique_counter = function(id_str){
    if(!(id_str in utils.unique_counters)) {
      utils.unique_counters[id_str] = 1;
      return 0;
    }
    return utils.unique_counters[id_str]++;
  };

  utils.recurs_guard = 0;

  utils.serialize_vue = function(data){
    let out = {};

    if(Array.isArray(data)){
      out = [];
    }

    utils.recurs_guard++;

    if(utils.recurs_guard > 10){
      console.error("busted recurs guard");
      return {};
    }

    for(let prop in data){
      if(parseInt(prop) == prop){
        prop = parseInt(prop);
      }

      if(data[prop] instanceof HTMLElement){
        continue;
      }

      if(data[prop] instanceof ShaderPlayerWebGL){
        continue;
      }

      if(data[prop] instanceof ShaderProgram){
        continue;
      }

      if(data[prop] instanceof File){
        // Too bad
      } else if(typeof(data[prop]) == "object"){
        // Exclude specified variables
        if(data.serializeExclude != undefined){
          if(data.serializeExclude.indexOf(prop) != -1){
            continue;
          }
        }
        out[prop] = utils.serialize_vue(data[prop]);
      } else {
        out[prop] = data[prop];
      }
    }

    utils.recurs_guard--;

    return out;
  };

  utils.unserialize_vue = function(data, json){
    let inData = json;

    for(let prop in inData){
      if(typeof(inData[prop]) == "object" && data[prop] != undefined){
        if(Array.isArray(inData[prop])){
          for(let i = 0; i < inData[prop].length; i++){
            data[prop].push(inData[prop][i]);
          }
        } else {
          utils.unserialize_vue(data[prop], inData[prop]);
        }
      } else {
        data[prop] = inData[prop];
      }
    }
  };

  utils.bounces = {};
  utils.debounce = function(id, fn){
    let now = new Date().getTime();

    if(utils.bounces[id] != undefined ){
      if(utils.bounces[id].timeout != null){
        clearTimeout(utils.bounces[id].timeout);
      }
    }
    if(utils.bounces[id] != undefined && Math.abs(utils.bounces[id].time - now) < 100){
      utils.bounces[id] = {
        time: now,
        timeout: setTimeout(fn, 300)
      };
    } else {
      utils.bounces[id] = {
        time: now,
        timeout: null
      };
      fn();
    }

    utils.bounces[id].time = now;
  }

  utils.ask_confirm = Vue.component('ask-confirm', {
    template:
    `<div class="popup ask-confirm">
     <div v-bind:class="container_class">
       <h3>
         {{message}}
       </h3>
       <button class="button-yes" v-on:click="on_yes_button">{{button_yes}}</button>
       <button class="button-no" v-on:click="on_no_button">{{button_no}}</button>
     </div>
   </div>`,
    data(){
      return {
        message: "Really?",
        button_yes: "Yes",
        button_no: "No",
        on_yes: function(){},
        on_no: function(){},
        container_class: ""
      }
    },
    props: ["settings"],
    methods: {
      on_yes_button(){
        try{
          this.on_yes();
        } catch(e){
          console.error(e);
        }
        this.destroy();
      },
      on_no_button(){
        try{
          this.on_no();
        } catch(e){
          console.error(e);
        }
        this.destroy();
      },
      destroy(){
        this.$destroy;
        this.$el.innerHTML = "";
        document.body.removeChild(this.$el);
      }
    },
  });

  utils.ask_file = Vue.component('ask-file', {
    template:
    `<div class="popup ask-file">
     <div v-bind:class="container_class">
       <div class="close-button" v-on:click="close">
         <img src="icons/feather-dark/x.svg" width="40"/>
       </div>

       <h3>
         {{title}}
       </h3>
       <p>{{message}}</p><br/>
       <p class="text-center">
         <label>
           <button v-on:click="button_click" class="dark-button">
             Upload a file
           </button>
           <input type="file" class="hidden" v-on:change="on_file_internal" multiple/>
         </label>
       </p><br/>
     </div>
   </div>`,
    data(){
      return {
        title: "Upload file",
        message: "",
        container_class: ""
      }
    },
    methods: {
      on_file_internal(e){
        let files = e.target.files;
        try{
          this.on_file(files);
        } catch (e) {
          console.error(e);
        }
        this.destroy();
      },
      button_click(){
        this.$el.querySelectorAll("input")[0].click();
      },
      destroy(){
        this.$destroy;
        this.$el.innerHTML = "";
        document.body.removeChild(this.$el);
      },
      close(){
        this.destroy();
      }
    },
  });



  utils.gfont_picker = Vue.component('gfont-picker', {
    template:
    `<div class="popup gfont-picker">
     <div v-bind:class="container_class">
       <h3>
         <img src="icons/feather-dark/edit-2.svg" width="30"/>
         Pick a font
       </h3>
       <div class="text-center">
         <input type="text" v-model="filter" placeholder="filter">
       </div>
       <br/>
       <div v-for="info in fonts">
         <span class="raw-fontname">{{info.font}}</span><br>
         <button class="gfont-button"
                v-on:click="on_font_button(info.font)">
           <img v-bind:data-fontName="info.font"
                v-bind:src="'/app/plugins/gfontTextLayer/font_previews/'+info.font+'.png'"
                v-bind:alt="info.font"/>
         </button><br>
       </div>
       <button v-on:click="load_more" class="load-more-button">
         View more!
       </button>
     </div>
   </div>`,
    data(){
      return {
        filter: "",
        fonts: [],
        on_font: ()=>{},
        container_class: ""
      }
    },
    props: ["settings"],
    methods: {
      on_font_button(fontName){
        try{
          this.on_font(fontName);
        } catch(e){
          console.error(e);
        }
        this.destroy();
      },
      destroy(){
        this.$destroy;
        this.$el.innerHTML = "";
        document.body.removeChild(this.$el);
      },
      load_more(){
        for(let i = 0; i < 8; i++){
          this.fonts.push(this.all_fonts[i]);
        }
        this.all_fonts = this.all_fonts.splice(15);
      }
    },
    watch:{
      filter(str){
        let to_display = [];
        let number_displayed = 0;

        for(let i in this.all_fonts){
          if(this.all_fonts[i].font.toLowerCase().indexOf(str.toLowerCase()) != -1){
            to_display.push(this.all_fonts[i]);
            number_displayed++;
            if(number_displayed > 15){
              break;
            }
          }
        }

        this.fonts = to_display;
      }
    },
    mounted(){
      let app = this;
      let req = fetch("/app/plugins/gfontTextLayer/fonts.json").then((resp) => {
        resp.json().then((data) => {
          app.all_fonts = data.splice(15);
          app.fonts = app.all_fonts.splice(0,15)
        });
      });
    }
  });

  utils.ask_interact = Vue.component('ask-interaction', {
    template:
    `<div class="popup ask-interaction">
     <div v-bind:class="container_class">
       <div class="close-button">
         <img src="icons/feather-dark/x.svg" width="40"/>
       </div>
       <h3>
         You need to interact so we can load a video!
       </h3>
       <button class="button-interact" v-on:click="on_interact_button">Interact!</button>
       <br/></br>
     </div>
   </div>`,
    data(){
      return {
        on_interact: function(){},
        container_class: ""
      }
    },
    props: ["settings"],
    methods: {
      on_interact_button(){
        try{
          this.on_interact();
        } catch(e){
          console.error(e);
        }
        this.destroy();
      },
      destroy(){
        this.$destroy();
        this.$el.innerHTML = "";
        document.body.removeChild(this.$el);
      }
    },
  });

  utils.flag_message = function(message, options){
    let box = document.createElement("div");
    options = options || {};

    box.classList.add("flag-message");
    box.classList.add("show");

    box.innerText = message;

    if(options.button_message){
      let button = document.createElement("button");
      button.classList.add("flag-message-button");
      button.innerText = options.button_message;
      box.appendChild(button);
      button.onclick = function(){
        close();
        options.button_action();
      };
    }

    function close(){
      if(box.parentNode == null){
        return;
      }
      box.classList.remove("show");
      setTimeout(function(){
        box.parentNode.removeChild(box);
      },300);
    }

    setTimeout(function(){
      close();
    }, 6000);

    document.body.appendChild(box);

    return box;
  };

  utils.flag_error = function(message, options){
    let box = utils.flag_message(message, options);
    box.classList.add("flag-error");
  };

  API.expose({
    name: "utils.flag_error",
    doc: `Show an error message

       `,
    argsdoc: ["Message to display"],
    no_ui: true,
    fn: utils.flag_error
  });

  utils.real_bad_error = function(message){
    fetch("/stats/real_bad_error/" + message);
    alert(message);
  };


})();
