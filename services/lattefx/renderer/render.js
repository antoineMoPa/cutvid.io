(function(){

  let worker;

  async function render(){
    console.error("old render func");
    return;
    await utils.ensure_ffmpeg_loaded();

    worker = await utils.create_ffmpeg_worker({
      logger: function(m){
        let match = /frame= *([0-9]*)/.exec(m.message);

        if(match != null){
          let frame_num = match[1];
          let frame_tot = window.API.call("shader_player.get_total_frames");
          let ratio = frame_num / frame_tot;
          let message = "Encoding frame " + frame_num + " of " + frame_tot;
          window.API.call("ui.set_progress", ratio, message);
        } else {
          console.log(m);
        }
      }
    });

    let draft = await window.API.call("player.render");

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
    window.API.call("download.show", blob);
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
