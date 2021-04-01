
class FileStore{
  constructor(){
    this.files = {};
    this.video_elements = {};
    this.audio_elements = {};
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