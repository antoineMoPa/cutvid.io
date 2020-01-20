function condense_css(){
  const purify = require("purify-css")

  let content = ["./index.dev.html"];
  let css = ["./libs/bulma.min.css", "./style.css"];

  let options = {
    output: false
  }

  let css_build = purify(content, css, options)


  // Quick hack to replace all styles by the condensed version

  const fs = require("fs")

  let index = fs.readFileSync("./index.dev.html", "utf8");

  index = index.replace('<link rel="stylesheet" href="libs/bulma.min.css">','');
  index = index.replace(
    '<link rel="stylesheet" href="style.css">',
    '<style>'+ css_build + '</style>'
  );

  fs.writeFileSync("index.html", index);
}

condense_css();
