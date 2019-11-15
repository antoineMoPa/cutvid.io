var app = new Vue({
  el: '#main_app',
  data: {
    settings: null,
    navigator_supported: true
  },
  template: `<div>
               <header>
                 <a href="https://lattefx.com/" target="_blank">
                   <img src="images/logo.png" class="header-logo" alt="Latte fx"/>
                 </a>
               </header>
               <player v-bind:settings="settings"></player>
               <div v-if="!navigator_supported" class="navigator-no-support">
                 <p style="font-weight:500;font-size:24px;">
                   Please open Lattefx in Chrome or Firefox
                 </p>
                 <p>
                   Currently, only Chrome and Firefox are supported.<br>
                   We use advanced WebGL rendering techniques that we cannot support<br> in other browsers due to limited time in life.
                 </p>
                 <input type="text" value="https://lattefx.com"></input>
                 <p style="font-size:10px;margin-top:0px;">Go ahead, copy paste in Chrome or Firefox!</p>
                 <p>
                   You can download Firefox at <a href="https://www.mozilla.org/en-CA/firefox/new/" target="_blank">mozilla.org</a>
                 </p>
                 <br><br>
                 <p style="font-size:11px;">
                   You can still try running Lattefx at your own risk:
                   <a v-on:click="navigator_supported = true" style="color:#3af;cursor:pointer;">
                     try anyway
                   </a>
                 </p>
               </div>
             </div>`,
  mounted(){
    let app = this;

    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('safari') != -1) {
      if (ua.indexOf('chrome') <= -1) {
        app.navigator_supported = false;
        console.log("safari detected");
      }
    }

    if (document.documentMode || /Edge/.test(navigator.userAgent)) {
      app.navigator_supported = false;
      console.log("Edge detected");
    }

    if (navigator.userAgent.indexOf("OPR") !== -1) {
      app.navigator_supported = false;
      console.log("Opera detected");
    }

    fetch("settings.json").then((resp) => {
      resp.json().then((data) => {
        this.settings = data;
        // These are settings that never change during an apps
        // lifetime, so might as well set it globally
        window.lattefx_settings = data;
      });
    });
  }
})
