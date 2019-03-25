// There are 877 fonts
let size = Math.ceil(Math.sqrt(877));
let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");
let w = 192;
let h = 48;
canvas.width = w * size;
canvas.height = h * size;

document.body.appendChild(canvas);

let loadedFonts = [];
let pre = document.createElement("pre");
document.body.appendChild(pre);

// Clear background
ctx.fillStyle = "#ffffff";
ctx.fillRect(0,0, canvas.width, canvas.height);

function load(){
  let index = 0;
  for(let font in gfonts){
    let curr = index;
    let i = Math.floor(curr/size);
    let j = curr % size;

    let x = i * w;
    let y = j * h;

    // Clear background
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    ctx.fillStyle = "#000000";

    utils.load_gfont(font);

    document.fonts.ready.then(function(){
      ctx.font = 20 + "px " + font;

      ctx.fillText(font.substr(0,20), x+w/2, y+h/2, w);
      loadedFonts.push({
        font,
        x1: x,
        y1: y,
        x2: x + w,
        y2: y + h,
      });
      pre.innerHTML = JSON.stringify(loadedFonts);
    });

    index++;
  }
}


load();
