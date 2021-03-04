module.exports = async function(api){

  function zero_pad(num){
    let out = "";
    let pad = 6;

    for(let i = 0; i < pad - (num+'').length; i++){
      out += '0';
    }

    return out + num;
  }

  function validate_media_id(video_media_id){
    return video_media_id.replace(/[^A-Za-z0-9]/g, "");
  }

  let promise = new Promise(function(resolve, reject){
    let shader_program = api.shader_program;
    let gl = api.gl;
    let sequence = api.sequence;
    let effect = sequence.effect;
    const fs = api.fs;
    const PNG = api.PNG
    const exec_sync = api.exec_sync;
    const get_pixels = api.get_pixels;

    let video_media_id = validate_media_id(sequence.effect.video_media_id);

    let trim_before = parseFloat(effect.trimBefore);
    let time_from = parseFloat(sequence.from);
    let time_to = parseFloat(sequence.to);
    let duration = time_to - time_from;
    let fps = api.fps;

    if (!fs.existsSync("./images-"+video_media_id)){
      fs.mkdirSync("./images-"+video_media_id);

      let command = [
        "ffmpeg",
        "-ss " + trim_before,
        "-i ./media/" + video_media_id,
        "-nostdin",
        "-y",
        "-start_number 0",
        "-frames:v " + parseInt(Math.ceil(fps * duration)),
        "-r " + fps,
        "-compression_level 100",
        "./images-" + video_media_id + "/image-%06d.png"];

      const child = exec_sync(command.join(" "),
                              (error, stdout, stderr) => {
                               console.log(`stdout: ${stdout}`);
                                console.log(`stderr: ${stderr}`);
                                if (error !== null) {
                                  console.log(`exec error: ${error}`);
                                }
                              });
    }

    async function load_image(file){
      let promise = new Promise(function(resolve, reject){
        get_pixels(file, function(err, pixels) {
          if(err) {
            console.log("Error getting pixels from image");
            reject(err);
            return;
          }

          gl.bindTexture(gl.TEXTURE_2D, shader_program.textures.video.texture);

          shader_program.set_texture_raw("video", {
            width: pixels.shape[0],
            height: pixels.shape[1],
            data: pixels.data
          });

          resolve();
        })
      });

      return promise;
    }


    let update_video = async function (fps, _, _, video_time) {
      let frame_id = parseInt((video_time - trim_before) * fps);
      let file_folder = './images-' + video_media_id + '/';
      let file = file_folder + 'image-' + zero_pad(frame_id) + '.png';

      return load_image(file);
    };

    // Initialize texture
    shader_program.set_texture_raw("video", null);

    // Bind texture updater
    shader_program.textures.video.isVideo = true;
    shader_program.textures.video.updateVideo = update_video;

    resolve();
  });

  return promise;
}
