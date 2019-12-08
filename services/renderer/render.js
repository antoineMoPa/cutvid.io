function flatten_plugin_list(plugins_list){
  let plugins_list_flat = {};

  // Flatten plugins list
  for(let i in plugins_list){
    for(let j in plugins_list[i]){
      plugins_list_flat[j] = true;
    }
  }
  return plugins_list_flat
}

function compile_program(gl, vertex, fragment){
  let code_folder = __dirname;
  let ShaderProgram = require(code_folder + '/shader_program.js');
  let pass = new ShaderProgram(gl, true);

  try{
    pass.compile(vertex, fragment);
  } catch (e) {
    console.log(e);
  }

  return pass;
}

async function attach_passes(gl, sequences){
  let code_folder = __dirname;
  const fs = require('fs');
  let plugins_list = JSON.parse(fs.readFileSync(code_folder + '/plugins_list.json'));
  plugins_list = flatten_plugin_list(plugins_list);

  for(let i in sequences){
    let programs = [];
    let seq = sequences[i];
    let effect_name = seq.effect.effectName;

    if(!(effect_name in plugins_list)){
      console.log(effect_name + " not in plugin list");
      continue;
    }

    let vertex = fs.readFileSync(code_folder + "/plugins/"+effect_name+"/vertex.glsl");
    let fragment = fs.readFileSync(code_folder + "/plugins/"+effect_name+"/fragment.glsl");
    let program = compile_program(gl, vertex, fragment);

    // This file can contain plugin-specific render code
    // (e.g: attach textures)
    let plugin_renderer_path = code_folder + "/plugins/"+effect_name+"/render.js";

    let fps = parseInt(player.fps);

    if(fs.existsSync(plugin_renderer_path)){
      let plugin = require(plugin_renderer_path);

      await plugin({
        gl: gl,
        shader_program: program,
        sequence: seq, // The values in sequence should never be trusted
        fs: fs,
        PNG: require('pngjs').PNG,
        exec_sync: require('child_process').execSync,
        get_pixels: require('get-pixels'),
        fps: fps
      }).catch((e) => {
        console.log("Error in plugin init:" + e)
      });
    }

    // Attach textures
    for(let t in seq.texture_urls){
      let url = seq.texture_urls[t];

      if(url == ""){
        continue;
      }

      var get_pixels = require("get-pixels");

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
        });
      }).catch((e) => {
        console.log("Error attaching texture: " + e)
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

function bind_image_saver(player) {
  let saved_count = 0;
  const fs = require('fs');
  let PNG = require('pngjs').PNG;

  let width = parseInt(player.width);
  let height = parseInt(player.height);
  let fps = parseInt(player.fps);
  let duration = this.player.get_total_duration();
  let total_count = parseInt(Math.ceil(fps * duration));

  return new Promise(function(resolve, reject){

    player.image_saver = (frame) => {
      console.log("begin save");
      let pixels = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      let image = new PNG({
        width: width,
        height: height,
        filterType: -1
      });

      image.data = pixels;

      let path = "./image-" + zero_pad(frame) + ".png";
      let ws = fs.createWriteStream(path)


      image.pack().pipe(ws);

      ws.on('finish',()=>{
        console.log("end save");
        saved_count++;
        if(saved_count == total_count){
          resolve();
        }
      });

      console.log("end writefile call");
    };
  });
}

function init_player(project_file_content){
  let code_folder = __dirname;
  let project = JSON.parse(project_file_content);

  let gl = require('gl')(project.width, project.height, {preserveDrawingBuffer: true, premultipliedAlpha: false});
  let ShaderPlayerWebGL = require(code_folder + '/shader_player_webgl.js');
  let player = new ShaderPlayerWebGL(null, gl);

  player.sequences = project.scenes;
  player.width = project.width;
  player.height = project.height;
  player.fps = project.fps;

  return [gl, player];
}

function render_frames(gl, player){
  return new Promise(function(resolve, reject){
    player.render_hq(()=>{
      var ext = gl.getExtension('STACKGL_destroy_context');
      ext.destroy();
      resolve();
    });
  });
}

function assemble_video(fps){
  return new Promise(function(resolve, reject){
    let exec_sync = require('child_process').execSync;

    console.log("Assembling video")

    let command = [
      "ffmpeg",
      "-r " + fps,
      "-i image-%06d.png",
      "-nostdin",
      "-y",
      "-r " + fps,
      "-vb", "20M",
      "./video.avi"];

    const child = exec_sync(
      command.join(" "),
      (error, stdout, stderr) => {
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        if (error !== null) {
          console.log(`exec error: ${error}`);
        }
      });

    resolve();
  });
}

async function render(gl, player){
  let fps = parseInt(player.fps);
  let all_saved_promise = bind_image_saver(player);

  await attach_passes(gl, player.sequences).catch((e) => {
    console.error("Error attaching passes: " + e);
  });
  await render_frames(gl, player).catch((e) => {
    console.error("Error rendering frames: " + e);
  });
  await all_saved_promise;
  await assemble_video(fps).catch((e) => {
    console.error("Error assembling video: " + e);
  });
}

const fs = require('fs');
[gl, player] = init_player(fs.readFileSync(process.argv[2]))

render(gl, player);
