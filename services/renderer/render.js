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
  let ShaderProgram = require(code_folder + '/../lattefx/shader_program.js');
  let pass = new ShaderProgram(gl, true);

  try{
    pass.compile(vertex, fragment);
  } catch (e) {
    console.log(e);
  }

  return pass;
}

function attach_uniforms(sequences){
  for(let i in sequences){
    let seq = sequences[i];
    seq.uniforms = seq.saved_uniforms;
  }
}

async function attach_passes(gl, sequences){
  /* Loads plugins & shaders for every sequence */
  let code_folder = __dirname;
  const fs = require('fs');
  let plugins_list = JSON.parse(fs.readFileSync(code_folder + '/../lattefx/plugins_list.json'));
  plugins_list = flatten_plugin_list(plugins_list);
  let plugins_folder = code_folder + "/../lattefx/plugins/";
  for(let i in sequences){
    let programs = [];
    let seq = sequences[i];
    let effect_name = seq.effect.effectName;

    if(!(effect_name in plugins_list)){
      console.log(effect_name + " not in plugin list");
      continue;
    }

    let vertex = fs.readFileSync(plugins_folder + effect_name+"/vertex.glsl");
    let fragment = fs.readFileSync(plugins_folder + effect_name+"/fragment.glsl");
    let program = compile_program(gl, vertex, fragment);

    // This file can contain plugin-specific render code
    // (e.g: attach textures)
    let plugin_renderer_path = plugins_folder + effect_name + "/render.js";

    let fps = parseInt(player.fps);

    // Load plugin specific rendering code
    if(fs.existsSync(plugin_renderer_path)){
      let plugin = require(plugin_renderer_path);

      // We give a certain API to plugins
      // which is this dictionnary
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

    player.image_saver = async function(frame) {
      let pixels = new Uint8Array(width * height * 4);

      await new Promise(function(resolve, reject){
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        resolve();
      });

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
        saved_count++;
        if(saved_count == total_count){
          resolve();
        }
      });
    };
  });
}

function init_player(project_file_content){
  let code_folder = __dirname;
  let project = JSON.parse(project_file_content);

  let gl = require('gl')(project.width, project.height, {preserveDrawingBuffer: true, premultipliedAlpha: false});
  let ShaderPlayerWebGL = require(code_folder + '/../lattefx/shader_player_webgl.js');
  let player = new ShaderPlayerWebGL(null, gl, project.width, project.height);

  player.sequences = project.scenes;
  player.saved_audio_sequences = project.saved_audio_sequences;
  player.fps = project.fps;

  return [gl, player];
}

function render_frames(gl, player){
  return new Promise(function(resolve, reject){
    player.render_hq(()=>{
      resolve();
    });
  });
}

function validate_file_has_audio(file_path){
  if(!fs.existsSync(file_path)){
    console.error("file does not exist : " + file_path);
    return false;
  }

  let exec_sync = require('child_process').execSync;

  let verify_audio_command = "ffprobe -i " + file_path + " -show_streams -select_streams a -loglevel fatal";

  let has_audio = false;

  let out = exec_sync(verify_audio_command);

  if(out.indexOf("index=") != -1){
    return true;
  }

  return false;
}

function validate_media_id(video_media_id){
  return video_media_id.replace(/[^A-Za-z0-9]/g, "");
}

function build_ffmpeg_audio_args(player){
  /*
    Build ffmpeg audio handling:

    - detect audio tracks
    - set volume of tracks
    - apply delay
    - trim to right duration
    - mix all tracks together

  */

  let audio_args = "";
  let audio_index = 0;

  let audio_sequences = player.saved_audio_sequences;
  let audio_mix = "";
  let audio_filter_graph = "";

  for(let i in audio_sequences){
    let sequence = audio_sequences[i];
    let time_from = parseFloat(sequence['from']);
    let time_to = parseFloat(sequence['to']);
    let trim_before = parseFloat(sequence['trimBefore']);

    if(sequence['digest'] == undefined){
      continue;
    }

    let file_digest = validate_media_id(sequence['digest']);
    let file_path = "./media/" + file_digest;

    let has_audio = validate_file_has_audio(file_path);

    if(!has_audio){
      continue;
    }

    if(time_from < 0){
      // Trim part before 0
      trim_before -= time_from;
      time_to -= time_from;
      time_from = 0;
    }

    let adelay = "";

    audio_args += [
      "-i", file_path + " "
    ].join(" ");

    let delay = parseInt((time_from)*1000);

    if(delay > 1){
      // This will have to be adapted for mono/5.1
      // the all=1 option could help but did not work
      // with my ffmpeg version
      adelay = "adelay=delays="+delay+"|"+delay;
    }

    // atrim is in seconds
    let duration = time_to - time_from;

    let atrim = "";

    atrim += "start=" + (trim_before) + ":";
    atrim += "end=" + (duration + trim_before);

    audio_index += 1;

    audio_filter_graph += "[" + audio_index + ":a]";
    audio_filter_graph += "volume=1.0:eval=frame";


    if(atrim != ""){
      audio_filter_graph += ",";
      audio_filter_graph += "atrim="+atrim;
    }

    if(adelay != ""){
      audio_filter_graph += "[t" + audio_index + "]";
      audio_filter_graph += ";[t" + audio_index + "]";
      audio_filter_graph += adelay;
    }

    audio_filter_graph += "[o"+audio_index+"];";

    audio_mix += "[o" + audio_index + "]";
  }

  audio_filter_graph +=  audio_mix + "amix=inputs=" + audio_index + ":duration=longest[a]";

  console.log("\nAUDIO FILTER GRAPH:");
  console.log(audio_filter_graph);
  console.log("\n");

  let map_args = "-map 0:v -map \"[a]\"";

  if(audio_index == 0){
    audio_args = "";
    audio_filter_graph = "";
    map_args = "";
  }

  return [audio_args, audio_filter_graph, map_args];
}



function build_ffmpeg_args(fps, audio_args, audio_filter_graph, map_args){

  let command = [
      "-r " + fps,
      "-i image-%06d.png",
      audio_args,
      audio_filter_graph,
      "-nostdin",
      "-y",
      "-r " + fps,
      "-vf \'vflip\'",
      "-vb", "20M",
      "-ac 2",
      map_args,
      "./video.avi"];

  return command;
}

function assemble_video(fps, player){

  return new Promise(function(resolve, reject){
    let exec_sync = require('child_process').execSync;

    console.log("Assembling video");

    let fps = parseInt(player.fps);
    let [audio_args, audio_filter_graph, map_args] = build_ffmpeg_audio_args(player);

    let audio_filter = "-filter_complex \"" + audio_filter_graph + "\"";

    let ffmpeg_args = build_ffmpeg_args(fps, audio_args, audio_filter, map_args).join(" ");
    let command = "ffmpeg " + ffmpeg_args;

    console.log("running: " + command);

    const child = exec_sync(
      command,
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
  let start = new Date();
  let fps = parseInt(player.fps);
  let all_saved_promise = bind_image_saver(player);

  /*
  await attach_passes(gl, player.sequences).catch((e) => {
    console.error("Error attaching passes: " + e);
  });
  */

  attach_uniforms(player.sequences);

  /*
  await render_frames(gl, player).catch((e) => {
    console.error("Error rendering frames: " + e);
  });
  */
  var ext = gl.getExtension('STACKGL_destroy_context');
  ext.destroy();

  //await all_saved_promise;
  await assemble_video(fps, player).catch((e) => {
    console.error("Error assembling video: " + e);
  });

  let end = new Date() - start;
  console.log('Video render time: %dms', end)
}

const fs = require('fs');
[gl, player] = init_player(fs.readFileSync(process.argv[2]))

render(gl, player);
