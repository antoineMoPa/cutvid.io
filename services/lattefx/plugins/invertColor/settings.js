/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
{
  let name = "invertColor";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Invert Colors",
      ui: {
        template: `
<div>
</div>`,
        data: function(){
          return {
            uniforms: {
            }
          };
        },
        props: ["player", "effect"],
        methods: {
        },
        watch: {
        },
        mounted(){
        }
      }
    }
  };



  utils.plugins[name + "-effectSettings"] = effectSettings;
}
