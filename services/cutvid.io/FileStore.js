/*

  Objective of the file store:

  Centralize file managmenent for 1 movie
  Have only one <video> element for a file (e.g even after cuts)
  Simplify file management to avoid bugs

 */

class FileStore{
  constructor(){
    this.files = {};
    this.video_elements = {};
    this.audio_elements = {};
  }

  async _export() {
    return new Promise(async (resolve, reject) => {
      let result = {};
      for (let filename in this.files) {
        let string = await utils.file_to_base64(this.files[filename]);
        result[filename] = string;
      }
      resolve(result);
    });
  }

  async _import (data) {
    return new Promise(async function (resolve, reject) {
      for (let filename in data) {
        try {
          let file = await fetch(data[filename]);
          this.files[filename] = await file.blob();
        } catch (e) {
          utils.flag_error("Error while reading an included file.");
        }
      }
      resolve();
    }.bind(this));
  }

  serialize(){
    return this.files;
  }

  clear(){
    this.files = {};
  }

  async get_video(name){
    let src = "";

    if(this.files[name] == undefined){
      return null;
    } else {
      src = URL.createObjectURL(this.files[name]);
    }

    if(this.video_elements[name] == undefined){
      let el = document.createElement("video");
      el.src = src;
      el.crossOrigin = true;
      this.video_elements[name] = el;

      let panel = document.querySelectorAll(".media-sources-panel")[0];
      // Showing video somewhere improves FPS
      panel.appendChild(el);
      el.classList.add("media-source-video");

    }

    return this.video_elements[name];
  }

  get_audio(name){
    if(this.audio_elements[name] == undefined){
      let el = document.createElement("audio");
      el.src = URL.createObjectURL(this.files[name]);
      this.audio_elements[name] = el;
    }

    return this.audio_elements[name];
  }
}
