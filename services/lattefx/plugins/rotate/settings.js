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
        async mounted(){
          await this.$nextTick();

          let textarea = document.createElement("textarea");
          textarea.value = this.effect.shaderProgram.fragment_shader_code
          this.$el.appendChild(textarea);

          let cm = await utils.make_code_mirror(textarea);
          cm.on("change", function(){
            let fragment = cm.getValue();
            // Recompile
            let program = this.effect.shaderProgram;
            program.compile(program.vertex_shader_code, fragment);
          }.bind(this));
        }
      }
    };
  };

  utils.plugins[name + "-effectSettings"] = effectSettings;
}
