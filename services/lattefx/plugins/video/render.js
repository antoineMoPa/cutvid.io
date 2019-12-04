module.exports = async function(shader_program, sequence, libs){
  let promise = new Promise(function(resolve, reject){
    const fs = libs.fs;
    const PNG = libs.PNG
    const execSync = libs.execSync;

    fs.createReadStream('./images/image-000001.png')
      .pipe(new PNG())
      .on('parsed', function() {
        console.log("setting tex");
        shader_program.set_texture_raw("video", this);
        resolve();
      });
  });

  return promise;
}
