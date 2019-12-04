const fs = require('fs');

let ShaderPlayerWebGL = require('./shader_player_webgl.js');
let ShaderProgram = require('./shader_program.js');

let PNG = require('pngjs').PNG;
let jpeg = require('jpeg-js');

let plugins_list = JSON.parse(fs.readFileSync('plugins_list.json'));
let plugins_list_flat = {};

// Flatten plugins list
for(let i in plugins_list){
  for(let j in plugins_list[i]){
    plugins_list_flat[j] = true;
  }
}

plugins_list = plugins_list_flat;

let project = JSON.parse(fs.readFileSync(process.argv[2]));

let gl = require('gl')(project.width, project.height, {preserveDrawingBuffer: true, premultipliedAlpha: false});
let player = new ShaderPlayerWebGL(null, gl);

player.sequences = project.scenes;
player.width = project.width;
player.height = project.height;
player.fps = project.fps;

function compile_program(gl, vertex, fragment){
  let pass = new ShaderProgram(gl, true);

  try{
    pass.compile(vertex, fragment);
  } catch (e) {
    console.log(e);
  }

  return pass;
}


async function attach_passes(gl, sequences){

  for(let i in sequences){
    let programs = [];
    let seq = sequences[i];
    let effect_name = seq.effect.effectName;

    if(!(effect_name in plugins_list)){
      console.log(effect_name + " not in plugin list");
      continue;
    }

    let vertex = fs.readFileSync("./plugins/"+effect_name+"/vertex.glsl");
    let fragment = fs.readFileSync("./plugins/"+effect_name+"/fragment.glsl");
    let program = compile_program(gl, vertex, fragment);

    // This file can contain plugin-specific render code
    // (e.g: attach textures)
    let plugin_renderer_path = "./plugins/"+effect_name+"/render.js";

    if(fs.existsSync(plugin_renderer_path)){
      let plugin = require(plugin_renderer_path);

      await plugin(program, seq, {
        fs: fs,
        PNG: PNG,
        execSync: require('child_process').execSync
      });
    }

    // Attach textures
    for(let t in seq.texture_urls){
      let url = seq.texture_urls[t];

      var get_pixels = require("get-pixels")

      await new Promise(function(resolve, reject){
        get_pixels(url, function(err, pixels) {
          if(err) {
            reject();
            return;
          }

          program.set_texture_raw(t, {
            width: pixels.shape[0],
            height: pixels.shape[1],
            data: pixels.data
          });

          resolve();
        })
      });
    }

    seq.effect.shaderProgram = program;
  }
}

function zero_pad(num){
  let out = "";
  let pad = 6;

  for(let i = 0; i < pad - (num+'').length; i++){
    out += '0';
  }

  return out + num;
}

player.image_saver = (frame, width, height) => {
  let pixels = new Uint8Array(width * height * 4);

  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  let image = new PNG({
    width: width,
    height: height,
    filterType: -1
  });

  for (var y = 0; y < image.height; y++) {
    for (var x = 0; x < image.width; x++) {
      var idx = (image.width * y + x) << 2;
      image.data[idx] = pixels[idx];
      image.data[idx+1] = pixels[idx+1];
      image.data[idx+2] = pixels[idx+2];
      image.data[idx+3] = pixels[idx+3];
    }
  }

  let path = "./image-" + zero_pad(frame) + ".png";
  fs.writeFileSync(path, PNG.sync.write(image));

};

attach_passes(gl, player.sequences).then(function(){
  player.render_hq(()=>{
    var ext = gl.getExtension('STACKGL_destroy_context');
    ext.destroy();
  });
})
