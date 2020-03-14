{
  let name = "rotate";

  let effectSettings = function(){
    return {
      name: name,
      human_name: "Rotate",
      ui: {
        template: `
<div>
  <p>Place this above other sequences to rotate their content.</p>
  <label>
    Angle<br/>
    <input type="number"
           v-model="uniforms.angle.value"
           step="10">
  </label>
</div>`,
        data: function(){
          return {
            logo: null,
            backgroundColor: "#000000",
            player: null,
            effect: null,
            shaderProgram: null,
            uniforms: {
              angle: {
                type: "f",
                len: 1,
                value: 90.0,
              }
            }
          };
        },
        props: [],
        methods: {
        },
        watch: {
        },
        mounted(){
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
