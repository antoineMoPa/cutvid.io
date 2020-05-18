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

  utils.small_videos_cache = {};

  utils.get_video_total_frames= async function(video_file){
    await Promise.all([
      utils.load_script("libs/ffmpeg/ffmpeg.min.js")
    ]);
    let worker;

    const { createWorker } = FFmpeg;

    let fps_regex = /\s*([0-9]*) fps/;
    let duration_regex = /Duration: ([0-9]*):([0-9]*):([0-9\.]*)/;
    let fps = null;
    let duration_in_seconds = null;

    try{
      worker = createWorker({
        corePath: "libs/ffmpeg/ffmpeg-core.js",
        logger: function(m){
          if(fps_regex.test(m.message)){
            fps = fps_regex.exec(m.message)[1];
          }
          if(duration_regex.test(m.message)){
            let match = duration_regex.exec(m.message);

            duration_in_seconds = match[3];
            duration_in_seconds += match[2] * 60;
            duration_in_seconds += match[1] * 60 * 60;
          }
        }
      });
    } catch (e) {
      // Don't care
    }

    await worker.load();

    await worker.write(
      "video_to_convert.video",
      video_file
    );

    // Get duration for progress bar
    try{
      await worker.run("-i video_to_convert.video");
    } catch (e) {
      // Don't care too much
    }

    let total_frames = fps * duration_in_seconds;

    return total_frames;
  };

  utils.make_small_video = async function(video_file, file_name){
    let cache_name = file_name;

    if(cache_name != undefined){
      if(utils.small_videos_cache[cache_name] != undefined &&
         utils.small_videos_cache[cache_name].status == "rendered"){
        return utils.small_videos_cache[cache_name].blob;
      }
    }

    window.API.call("ui.set_progress", 0.01, "Loading ffmpeg.");

    await Promise.all([
      utils.load_script("libs/ffmpeg/ffmpeg.min.js")
    ]);

    window.API.call("ui.set_progress", 0.02, "Getting video duration.");
    let total_frames = await utils.get_video_total_frames(video_file);

    let worker;

    const { createWorker } = FFmpeg;

    let frame_regex = /frame=\s*([0-9]*)/;

    worker = createWorker({
      corePath: "libs/ffmpeg/ffmpeg-core.js",
      logger: function(m){
        // What a hardcode though
        if(m.message == "Conversion failed!"){
          window.API.call(
            "utils.flag_error",
            "We encountered an error while converting your file."
          );
          window.API.call("ui.clear_progress");
        }
        if(frame_regex.test(m.message)){
          let match = frame_regex.exec(m.message);
          let frame = match[1];
          let progress = frame / total_frames;
          window.API.call("ui.set_progress", progress,
                          `Building video preview : frame ${frame} of ${total_frames}.`);
        }
      }
    });

    window.API.call("ui.set_progress", 0.15, "Generating preview: You can keep working.");
    await worker.load();

    await worker.write(
      "video_to_convert.video",
      video_file
    );

    // Make video
    await worker.run("-i video_to_convert.video -vf scale=48x48 "+
                     "-sws_flags neighbor -pix_fmt yuv420p " +
                     "output.mp4");

    let result = await worker.read("output.mp4");

    let blob = new Blob([result.data], {
      type: "video/mp4"
    });

    window.API.call("ui.set_progress", 1.0, "Done!");
    setTimeout(function(){
      window.API.call("ui.clear_progress");
    }, 3000);

    utils.small_videos_cache[cache_name] = {
      "status": "rendered",
      "blob": blob
    };

    return blob;
  };

  API.expose({
    name: "utils.make_small_video",
    doc: `Make a small preview version of a video

          Makes a small version of a video (for quick seek previews)

          video is around 48:48px
          `,
    argsdoc: ["Original video file", "Unique name for cache"],
    no_ui: true,
    fn: utils.make_small_video
  });


  utils.gif_to_video = async function(gif_file){
    // Converts a gif to a mp4 file

    let worker;
    let job_counter = 0;

    window.API.call("ui.set_progress", 0.05, "Loading ffmpeg.");

    await Promise.all([
      utils.load_script("libs/ffmpeg/ffmpeg.min.js")
    ]);

    const { createWorker } = FFmpeg;

    window.API.call("ui.set_progress", 0.1, "Initiating gif converter.");

    let last_progress = 0.0;

    worker = createWorker({
      corePath: "libs/ffmpeg/ffmpeg-core.js",
      logger: function(m){
        // What a hardcode though
        if(m.message == "Conversion failed!"){
          window.API.call(
            "utils.flag_error",
            "We encountered an error while converting your file."
          );
          window.API.call("ui.clear_progress");
        }
        if(m.message.indexOf("frame=") != -1){
          // Advance progress a bit
          last_progress += 0.08;
          let entertain_progress = 0.3 + (0.7-0.7/(last_progress + 1.0));
          window.API.call("ui.set_progress", entertain_progress, "Converting gif to video.");
        }
      }
    });

    job_counter++;
    let current_job = job_counter;

    await worker.load(current_job);

    await worker.write(
      "gif_file.gif",
      gif_file
    );

    await worker.run("-i gif_file.gif -pix_fmt yuv420p output.mp4");

    let result = await worker.read("output.mp4");

    window.API.call("ui.set_progress", 0.99, "Gif converted!");
    setTimeout(function(){
      window.API.call("ui.clear_progress");
    }, 3000);

    let blob = new Blob([result.data], {
      type: "video/mp4"
    });

    return blob;
  }

})();
