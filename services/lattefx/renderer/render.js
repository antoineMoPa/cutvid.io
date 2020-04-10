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
      logger: m => console.log(m)
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
