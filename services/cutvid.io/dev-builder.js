var watch = require('node-watch');
let {build} = require('./build');

build();

watch('.', { recursive: true }, function(evt, name) {
  build();
});
