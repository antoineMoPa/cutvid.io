var utils = {};

// Tool to load google webfonts with title
utils.loaded_gfonts = {};
utils.load_gfont = function(name_in, callback){
  // Was font already loaded
  if(typeof utils.loaded_gfonts[name_in] != "undefined"){
    return;
  }
  
  utils.loaded_gfonts[name_in] = "loading";
  
  // Format name
  var name = name_in.replace(" ","+");
  var url = "https://fonts.googleapis.com/css?family="+name;
  var l = document.createElement("link");
  
  // Add attributes
  l.setAttribute("rel", "stylesheet");
  l.setAttribute("href", url);
  
  if("fonts" in document){
	document.fonts.onloadingdone = callback;
  } else {
	l.onload = callback;
  }
  
  // Add element to page
  document.head.appendChild(l);
  
  // Set as loaded
  utils.loaded_gfonts[name_in] = "loaded";
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
    utils.scripts[url].callbacks.push(callback)
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
