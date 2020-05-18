(function(){
  let API = window.API;
  utils.small_videos_cache = {};


  utils.small_videos_cache = {};

  utils.get_video_total_frames= async function(video_file){
    await Promise.all([
      utils.load_script("libs/ffmpeg/ffmpeg.min.js")
    ]);
    let worker;

    const { createWorker } = FFmpeg;

    let fps_regex = /\s*([0-9]*) fps/;
    let duration_regex = /Duration: ([0-9]*):([0-9]*):([0-9\.]*)/;
    let fps = null;
    let duration_in_seconds = null;

    try{
      worker = createWorker({
        corePath: "libs/ffmpeg/ffmpeg-core.js",
        logger: function(m){
          if(fps_regex.test(m.message)){
            fps = fps_regex.exec(m.message)[1];
          }
          if(duration_regex.test(m.message)){
            let match = duration_regex.exec(m.message);

            duration_in_seconds = match[3];
            duration_in_seconds += match[2] * 60;
            duration_in_seconds += match[1] * 60 * 60;
          }
        }
      });
    } catch (e) {
      // Don't care
    }

    await worker.load();

    await worker.write(
      "video_to_convert.video",
      video_file
    );

    // Get duration for progress bar
    try{
      await worker.run("-i video_to_convert.video");
    } catch (e) {
      // Don't care too much
    }

    let total_frames = fps * duration_in_seconds;

    return total_frames;
  };

  utils.make_small_video = async function(video_file, file_name){
    let cache_name = file_name;

    if(cache_name != undefined){
      if(utils.small_videos_cache[cache_name] != undefined &&
         utils.small_videos_cache[cache_name].status == "rendered"){
        return utils.small_videos_cache[cache_name].blob;
      }
    }

    window.API.call("ui.set_progress", 0.01, "Loading ffmpeg.");

    await Promise.all([
      utils.load_script("libs/ffmpeg/ffmpeg.min.js")
    ]);

    window.API.call("ui.set_progress", 0.02, "Getting video duration.");
    let total_frames = await utils.get_video_total_frames(video_file);

    let worker;

    const { createWorker } = FFmpeg;

    let frame_regex = /frame=\s*([0-9]*)/;

    worker = createWorker({
      corePath: "libs/ffmpeg/ffmpeg-core.js",
      logger: function(m){
        // What a hardcode though
        if(m.message == "Conversion failed!"){
          window.API.call(
            "utils.flag_error",
            "We encountered an error while converting your file."
          );
          window.API.call("ui.clear_progress");
        }
        if(frame_regex.test(m.message)){
          let match = frame_regex.exec(m.message);
          let frame = match[1];
          let progress = frame / total_frames;
          window.API.call("ui.set_progress", progress,
                          `Building video preview : frame ${frame} of ${total_frames}.`);
        }
      }
    });

    window.API.call("ui.set_progress", 0.15, "Generating preview: You can keep working.");
    await worker.load();

    await worker.write(
      "video_to_convert.video",
      video_file
    );

    // Make video
    await worker.run("-i video_to_convert.video -vf scale=48x48 "+
                     "-sws_flags neighbor -pix_fmt yuv420p " +
                     "output.mp4");

    let result = await worker.read("output.mp4");

    let blob = new Blob([result.data], {
      type: "video/mp4"
    });

    window.API.call("ui.set_progress", 1.0, "Done!");
    setTimeout(function(){
      window.API.call("ui.clear_progress");
    }, 3000);

    utils.small_videos_cache[cache_name] = {
      "status": "rendered",
      "blob": blob
    };

    return blob;
  };

  API.expose({
    name: "utils.make_small_video",
    doc: `Make a small preview version of a video

          Makes a small version of a video (for quick seek previews)

          video is around 48:48px
          `,
    argsdoc: ["Original video file", "Unique name for cache"],
    no_ui: true,
    fn: utils.make_small_video
  });


  utils.gif_to_video = async function(gif_file){
    // Converts a gif to a mp4 file

    let worker;
    let job_counter = 0;

    window.API.call("ui.set_progress", 0.05, "Loading ffmpeg.");

    await Promise.all([
      utils.load_script("libs/ffmpeg/ffmpeg.min.js")
    ]);

    const { createWorker } = FFmpeg;

    window.API.call("ui.set_progress", 0.1, "Initiating gif converter.");

    let last_progress = 0.0;
    let frame_regex = /frame=\s*([0-9]*)/;

    worker = createWorker({
      corePath: "libs/ffmpeg/ffmpeg-core.js",
      logger: function(m){
        // What a hardcode though
        if(m.message == "Conversion failed!"){
          window.API.call(
            "utils.flag_error",
            "We encountered an error while converting your file."
          );
          window.API.call("ui.clear_progress");
        }
        if(frame_regex.test(m.message)){
          let match = frame_regex.exec(m.message);
          let frame = match[1];
          // Advance progress a bit
          last_progress += 0.08;
          let entertain_progress = 0.3 + (0.7-0.7/(last_progress + 1.0));
          window.API.call("ui.set_progress", entertain_progress,
                          `Converting gif to video (Frame ${frame}).`);
        }
      }
    });

    job_counter++;
    let current_job = job_counter;

    await worker.load(current_job);

    await worker.write(
      "gif_file.gif",
      gif_file
    );

    await worker.run("-i gif_file.gif -pix_fmt yuv420p output.mp4");

    let result = await worker.read("output.mp4");

    window.API.call("ui.set_progress", 0.99, "Gif converted!");
    setTimeout(function(){
      window.API.call("ui.clear_progress");
    }, 3000);

    let blob = new Blob([result.data], {
      type: "video/mp4"
    });

    return blob;
  }
})();
