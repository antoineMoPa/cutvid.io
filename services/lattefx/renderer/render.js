(function(){

  let worker;
  let job_counter = 0;

  async function render(){
    await Promise.all([
      utils.load_script("libs/ffmpeg/ffmpeg.min.js")
    ]);

    const { createWorker } = FFmpeg;
    worker = createWorker({
      corePath: "libs/ffmpeg/ffmpeg-core.js",
      logger: function(m){
        let match = /frame= *([0-9]*)/.exec(m.message);
        if(match != null){
          let frame_num = match[1];
          let frame_tot = window.API.call("shader_player.get_total_frames");
          let ratio = frame_num / frame_tot;
          let message = "Encoding frame " + frame_num + " of " + frame_tot;
          window.API.call("ui.set_progress", ratio, message);
        }
      }
    });

    job_counter++;
    let current_job = job_counter;

    await worker.load(current_job);

    let draft = await window.API.call("player.render_draft");

    await worker.write(
      "draft",
      draft
    );

    await worker.run("-i draft -filter:v fps=fps=20 output.mp4");

    let result = await worker.read("output.mp4");
    let blob = new Blob([result.data], {
      type: "video/mp4"
    });

    window.API.call("ui.clear_progress");
    window.API.call("download_lq.show", blob);
  }

  window.API.expose({
    name: "renderer.render",
    doc: `Render the video

        `,
    fn: function(){
      render();
    }.bind(this)
  });

  window.API.expose({
    name: "renderer.hot_reload",
    doc: `Hot Reload Renderer

        Useful for debugging.

        `,
    fn: function(){
      utils.load_script("renderer/render.js?" + Math.random());
    }.bind(this)
  });

})();
