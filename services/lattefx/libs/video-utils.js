(function(){
  let API = window.API;
  utils.small_videos_cache = {};

  /* Single entry point in case ffmpeg path changes again */
  utils.ensure_ffmpeg_loaded = async function(){
    console.error("utils.ensure_ffmpeg_loaded: deprecated");
    return true;
  };

  utils.cancellable_workers_by_type = {
    "metadata": [],
    "preview": [],
    "render": [],
    "unknown": []
  };

  utils.cancel_workers_by_type = function(type){
    let workers_to_cancel = utils.cancellable_workers_by_type[type];

    for(let i in workers_to_cancel){
      try{
        workers_to_cancel[i].terminate();
      } catch (e) {
        // Worker might just be done
      }
    }

    window.API.call("ui.clear_progress");

    utils.cancellable_workers_by_type[type] = [];
  }

  /* Single entry point in case ffmpeg path/library changes again

     options example:

     {
       MEMFS: [{name: "file.webm", data: data}],
       arguments: ["-i", "file.webm"],
       logger: function(msgtxt, msg) { console.log(msg) }
     }

   */
  utils.run_ffmpeg_task = async function(options, cancellable_worker_type){
    cancellable_worker_type = cancellable_worker_type || "unknown";
    return new Promise(function(resolve){
      let worker = new Worker("libs/ffmpeg.js/ffmpeg-worker-mp4.js");

      utils.cancellable_workers_by_type[cancellable_worker_type].push(worker);
      // what a hack
      utils.cancellable_workers_by_type[cancellable_worker_type].push({
        terminate: function(){ resolve(null); }
      });
      // TODO: Reject promise on cancel
      // TODO: Manage rejection in methods that use utils.run_ffmpeg_task

      // Memfs example
      // [{name: "input.webm", data: input},
      //  {name: "output.m4", data: output}],

      worker.onmessage = function(e) {
        const msg = e.data;
        switch (msg.type) {
        case "ready":
          worker.postMessage({
            type: "run",
            arguments: options.arguments,
            MEMFS: options.MEMFS
          });
          break;
        case "stdout":
          options.logger(msg.data, msg);
          console.log(msg.data);
          break;
        case "stderr":
          options.logger(msg.data, msg);
          console.log(msg.data);
          break;
        case "done":
          resolve(msg.data);
          break;
        }
      };
    });
  };

  utils.small_videos_cache = {};

  utils.get_video_info= async function(video_file){

    let fps_regex = /\s*([0-9]*) fps/;
    let duration_regex = /Duration: ([0-9]*):([0-9]*):([0-9\.]*)/;
    let stream_regex = /Stream #(.*)$/;
    let fps = null;
    let duration_in_seconds = null;
    let has_audio = false;

    let data = await utils.run_ffmpeg_task({
      arguments: ["-i", "video_to_convert.video"],
      MEMFS: [{
        name: "video_to_convert.video",
        data: await video_file.arrayBuffer()
      }],
      logger: function(m){
        if(fps_regex.test(m)){
          fps = parseFloat(fps_regex.exec(m)[1]);
        }
        if(duration_regex.test(m)){
          let match = duration_regex.exec(m);

          duration_in_seconds = match[3];
          duration_in_seconds += match[2] * 60;
          duration_in_seconds += match[1] * 60 * 60;
        }
        if(stream_regex.test(m)){
          let match = stream_regex.exec(m);

          if(match[0].indexOf("Audio") != -1){
            has_audio = true;
          }
        }
      }
    }, "metadata");

    let total_frames = fps * duration_in_seconds;

    return {total_frames, fps, has_audio};
  };

  utils.make_small_video = async function(video_file, file_name){
    let cache_name = file_name;

    if (cache_name != undefined){
      if (utils.small_videos_cache[cache_name] != undefined) {
        if (utils.small_videos_cache[cache_name].status == "rendered"){
          return utils.small_videos_cache[cache_name].blob;
        } else {
          return utils.small_videos_cache[cache_name].promise;
        }
      }
    }

    utils.small_videos_cache[cache_name] = {
      status: "rendering",
      promise: new Promise(async function(resolve, reject){

        window.API.call("ui.begin_progress");
        window.API.call("ui.set_progress", 0.01, "Loading ffmpeg.");

        window.API.call("ui.set_progress", 0.02, "Preparing to build preview.",
                        function cancel_action(){
                          utils.cancel_workers_by_type("metadata");
                          utils.cancel_workers_by_type("preview");
                          window.API.call(
                            "utils.flag_error",
                            "Video preview cancelled."
                          );
                          reject();
                        });

        let info = await utils.get_video_info(video_file);
        let preview_fps = 8;
        let fps_ratio = info.fps / preview_fps;
        let total_frames = info.total_frames / fps_ratio;

        let frame_regex = /frame=\s*([0-9]*)/;

        let result = await utils.run_ffmpeg_task({
          arguments: [
            "-discard", "noref",
            "-sws_flags", "neighbor",
            "-i",
            "video_to_convert.video",
            "-pix_fmt", "yuv420p",
            "-an",
            "-vf", "scale=48x48,fps=fps=" + preview_fps,
            "output.mp4"
          ],
          MEMFS: [{
            name: "video_to_convert.video",
            data: await video_file.arrayBuffer()
          }],
          logger: function(m){
            if(m == "Conversion failed!"){
              window.API.call(
                "utils.flag_error",
                "We encountered an error while converting your file."
              );
              window.API.call("ui.clear_progress");
            }
            if(frame_regex.test(m)){
              let match = frame_regex.exec(m);
              let frame = match[1];
              let progress = frame / total_frames;
              window.API.call(
                "ui.set_progress",
                progress, `Building video preview : frame ${frame} of ${parseInt(total_frames)}.`,
                function cancel_action(){
                  utils.cancel_workers_by_type("preview");

                  window.API.call(
                    "utils.flag_error",
                    "Video preview cancelled."
                  );

                  resolve(null);
                }
              );
            }
            if(/Invalid data found when processing input/.test(m)){
              window.API.call(
                "utils.flag_error",
                "This video file type is not supported."
              );
              window.API.call("ui.clear_progress");
              resolve(null);
            }
          }
        }, "preview");

        if (result === false) {
          return null;
        }

        window.API.call("ui.set_progress", 0.15, "Generating preview: You can keep working.");

        let blob = new Blob([result.MEMFS[0].data], {
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

        resolve(blob);
      })
    };

    return await utils.small_videos_cache[cache_name].promise;
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

    window.API.call("ui.begin_progress");
    window.API.call("ui.set_progress", 0.05, "Loading ffmpeg.");

    window.API.call("ui.set_progress", 0.1, "Initiating gif converter.");

    let last_progress = 0.0;
    let frame_regex = /frame=\s*([0-9]*)/;

    let result = await utils.run_ffmpeg_task({
      arguments: [
        "-i", "gif_file.gif", "-pix_fmt", "yuv420p", "output.mp4"
      ],
      MEMFS: [{
        name: "gif_file.gif", data: await gif_file.arrayBuffer()
      }],
      logger: function(m){
        if(m == "Conversion failed!"){
          window.API.call(
            "utils.flag_error",
            "We encountered an error while converting your file."
          );
          window.API.call("ui.clear_progress");
        }
        if(frame_regex.test(m)){
          let match = frame_regex.exec(m);
          let frame = match[1];
          // Advance progress a bit
          last_progress += 0.08;
          let entertain_progress = 0.3 + (0.7-0.7/(last_progress + 1.0));
          window.API.call("ui.set_progress", entertain_progress,
                          `Converting gif to video (Frame ${frame}).`);
        }
      }
    });

    let blob = new Blob([result.MEMFS[0].data], {
      type: "video/mp4"
    });

    window.API.call("ui.set_progress", 0.99, "Gif converted!");
    setTimeout(function(){
      window.API.call("ui.clear_progress");
    }, 3000);

    return blob;
  }

  // TODO: it is a bit ugly to have these sort of function in a utils file
  //       instead of some library
  utils.build_ffmpeg_audio_args = async function (audio_sequences){
    /*
      Build ffmpeg audio handling:

      - detect audio tracks
      - set volume of tracks
      - apply delay
      - trim to right duration
      - mix all tracks together
    */

    let audio_args = [];
    let audio_index = 0;

    let audio_mix = "";
    let audio_filter_graph = "";

    for(let i in audio_sequences){

      let sequence = audio_sequences[i];
      let name = sequence.file_name;
      let file_store = window.API.call("shader_player.get_file_store");
      let info = await utils.get_video_info(file_store.files[name]);

      if(!info.has_audio){
        continue;
      }

      let time_from = parseFloat(sequence['from']);
      let time_to = parseFloat(sequence['to']);
      let trim_before = parseFloat(sequence['trimBefore']);

      if(time_from < 0){
        // Trim part before 0
        trim_before -= time_from;
        time_to -= time_from;
        time_from = 0;
      }

      let adelay = "";

      audio_args = audio_args.concat(["-i", sequence.file_name]);

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

      let volume = parseFloat(sequence.volume);
      audio_filter_graph += "[" + audio_index + ":a]";
      audio_filter_graph += "volume="+volume+":eval=frame";

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

    let map_args = [];

    // No audio? then return nothing
    if(audio_index == 0){
      audio_args = [];
      audio_filter_graph = "";
      map_args = [];

      return [[], [], []];
    } else {
      audio_filter_graph +=  audio_mix + "amix=inputs=" + audio_index + ":duration=longest[a]";

      map_args = map_args.concat(["-map", "[a]"]);
    }

    console.log("\nAUDIO FILTER GRAPH:");
    console.log(audio_filter_graph);
    console.log("\n");

    audio_filter_graph = ["-filter_complex", audio_filter_graph];

    return [audio_args, audio_filter_graph, map_args];
  }

  utils.build_ffmpeg_image_to_video_args = function(
    fps,
    audio_args,
    audio_filter_graph,
    map_args,
    output_format_extension
  ){
    output_format_extension = output_format_extension || "mp4";

    let command = [
      "-framerate", fps+"",
      "-i", "image-%06d.png",
    ].concat(
      audio_args
    ).concat(
      audio_filter_graph
    ).concat([
      "-nostdin",
      "-y",
      "-r", fps+"",
      "-pix_fmt", "yuv420p",
      "-vb", "20M",
      "-map", "0:v",
      "-ac", "2",
    ]).concat(
      map_args
    ).concat(["./video." + output_format_extension]);

    return command;
  }


})();
