var zip = new JSZip();

function load(){
  let index = 0;

  for(let font in gfonts){
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    canvas.width = 192;
    canvas.height = 48;
    let curr = index;
    let x = canvas.width/2;
    let y = canvas.height/2;

    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    ctx.fillStyle = "#000000";

    utils.load_gfont(font);

	document.fonts.ready.then(function(){
      ctx.font = 20 + "px " + font;
      console.log(font);
      ctx.fillText(font, canvas.width/2, canvas.height/2);
      document.body.appendChild(canvas);
	  canvas.toBlob((blob) => {
        zip.file(
          font + '.png',
          blob
        );
      });
    });
  }

  index++;
}

load();

function make_zip(){
  zip.generateAsync({type:"blob"})
	.then(function(content) {
	  let link = document.createElement("a");
	  link.innerHTML = "Download zip";
	  link.href = URL.createObjectURL(content);
	  document.body.appendChild(link);
	});
}
