module.exports = async function(api){

  function validate_media_id(video_media_id){
    return video_media_id.replace(/[^A-Za-z0-9]/g, "");
  }

  let promise = new Promise(function(resolve, reject){
    let shader_program = api.shader_program;
    let gl = api.gl;
    let sequence = api.sequence;
    const fs = api.fs;
    const PNG = api.PNG
    const exec_sync = api.exec_sync;
    const get_pixels = api.get_pixels;

    let video_media_id = validate_media_id(sequence.effect.video_media_id);

    if (!fs.existsSync("./images")){
      fs.mkdirSync("./images");
    }

    let command = [
      "ffmpeg -ss 0.0 -i ",
      "./media/" + video_media_id,
      " -nostdin -y",
      "-start_number 0",
      "-frames:v 1",
      "-r 30",
      "-compression_level 100",
      " images/image-%06d.png"];

    const child = exec_sync(command.join(" "),
                           (error, stdout, stderr) => {
                             console.log(`stdout: ${stdout}`);
                             console.log(`stderr: ${stderr}`);
                             if (error !== null) {
                               console.log(`exec error: ${error}`);
                             }
                             });

    async function load_image(file, fps, trimBefore, from, video_time){
      let promise = new Promise(function(resolve, reject){
        get_pixels(file, function(err, pixels) {
          if(err) {
            reject();
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

    let file = './images/image-000000.png';

    let update_video = async function (fps, trimBefore, from, video_time) {
      return load_image(file, fps, trimBefore, from, video_time);
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
