var utils = {};

// Tool to load google webfonts with title
utils.loaded_gfonts = {};

utils.load_gfont = function(name_in){
  // Was font already loaded
  if(utils.loaded_gfonts[name_in] != undefined){
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
  document.head.appendChild(l);

  if("fonts" in document){
    let fakeDiv = document.createElement("div");
    fakeDiv.innerHTML = "<span style='font-family:" + name_in + ";'>" + name_in + "</span>";
    document.body.appendChild(fakeDiv);
    document.fonts.ready.then(function(){
      fakeDiv.parentNode.removeChild(fakeDiv);
      utils.loaded_gfonts[name_in] = "loaded";
    });

  } else {
    // Set as loaded
    utils.loaded_gfonts[name_in] = "loaded";
  }
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
	if(typeof(inData[prop]) == "object"){
	  utils.unserialize_vue(data[prop], inData[prop]);
	} else {
	  data[prop] = inData[prop];
	}
  }
};
