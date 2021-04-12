var concat = require("source-map-concat");
var fs     = require("fs");
var path   = require("path");

var resolveSourceMapSync = require("source-map-resolve").resolveSourceMapSync;
var createDummySourceMap = require("source-map-dummy");

/**
 * Concatenate all js files and generate source map
 * outputs to app.build.js
 *         and app.build.js.map
 */
function build() {
  var jsFiles = [
    "./libs/vue.js",
    "./api.js",
    "./libs/utils.js",
    "./libs/video-utils.js",
    "./libs/dev.js",
    "./FileStore.js",
    "./shader_program.js",
    "./shader_player_webgl.js",
    "./components/sequence_effects.js",
    "./components/text_box.js",
    "./components/panel_selector.js",
    "./components/effects_selector.js",
    "./components/download_video.js",
    "./components/render_settings.js",
    "./components/sequencer.js",
    "./components/ui.js",
    "./components/player.js",
    "./components/console.js",
    "./app.js"
  ];

  jsFiles = jsFiles.map(function(file) {
    return {
      source: file,
      code: fs.readFileSync(file).toString()
    }
  });

  jsFiles.forEach(function(file) {
    var previousMap = resolveSourceMapSync(file.code, file.source, fs.readFileSync);
    if (previousMap) {
      file.map = previousMap.map;
      file.sourcesRelativeTo = previousMap.sourcesRelativeTo;
    } else {
      file.map = createDummySourceMap(file.code, {source: file.source, type: "js"});
    }
  });

  function wrap(node, file) {
    node.prepend("// File: " + file.source + "\n");
    node.add("// End file: " + file.source + "\n");
  }

  var output = "app.build.js";

  var concatenated = concat(jsFiles, {
    delimiter: "\n",
    process: wrap,
    mapPath: output + ".map"
  });

  concatenated.prepend("//# sourceMappingURL=/app.build.js.map\n");

  var result = concatenated.toStringWithSourceMap({
    file: path.basename(output)
  });

  fs.writeFileSync(output, result.code);
  fs.writeFileSync(output + ".map", result.map.toString());
}

build();

module.exports = {build};
