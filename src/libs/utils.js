var utils = {};

// Tool to load google webfonts with title
utils.loaded_gfonts = {};

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
    fakeDiv.innerHTML = "<span style='font-family:" + name_in + ";'>" + name_in + "</span>";

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

utils.load_script = function(url, callback){
  // Already loaded?
  if(url in utils.scripts){
    if(utils.scripts[url].ready){
      callback();
    } else {
      utils.scripts[url].callbacks.push(callback);
    }
    return;
  }

  utils.scripts[url] = {ready: false, callbacks: []};

  let script = document.createElement("script");

  script.onload = function(){
    utils.scripts[url].callbacks.push(callback);
    utils.scripts[url].ready = true;
    let cbs = utils.scripts[url].callbacks;
    cbs.forEach((cb) => {cb()});
  };
  script.src = url + "?" + Math.random();
  document.body.appendChild(script);
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

utils.serialize_vue = function(data){
  let out = {};

  for(let prop in data){
    if(typeof(data[prop]) == "object"){
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

  return out;
};

utils.unserialize_vue = function(data, json){
  let inData = json;

  for(let prop in inData){
    if(typeof(inData[prop]) == "object" && data[prop] != undefined){
      utils.unserialize_vue(data[prop], inData[prop]);
    } else {
      data[prop] = inData[prop];
    }
  }
};

utils.bounces = {};
utils.debounce = function(id, fn){
  let now = new Date().getTime();

  if(utils.bounces[id] != undefined &&
     Math.abs(utils.bounces[id].time - now) < 200){
    return;
  }

  utils.bounces[id] = {
    time: now - 300,
  };

  fn();

  utils.bounces[id].time = now;
}
