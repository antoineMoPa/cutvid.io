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
  l.onload = callback;
  // Add element to page
  document.head.appendChild(l);
  
  // Set as loaded
  utils.loaded_gfonts[name_in] = "loaded";
}
