/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "fadeSceneReveal";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Fade Scene Reveal",
      ui: {
        template: `
<div>
  <p>Place this above 2 other layers.<br>
  It will reveal the second.</p>
</div>`,
        data: function(){
          return {
            logo: null,
            backgroundColor: "#000000",
            player: null,
            effect: null,
            shaderProgram: null,
            uniforms: {
              logoWidth: {
                type: "f",
                len: 1,
                value: 1,
              },
            }
          };
        },
        props: [],
        methods: {
        },
        watch: {
        },
        mounted(){
          this.updateTexts();
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
