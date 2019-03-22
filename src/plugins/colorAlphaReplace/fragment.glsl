precision highp float;

varying vec2 UV;
varying vec2 lastUV;
uniform sampler2D in_tex;
uniform vec2 mouse;
uniform float ratio, time;
uniform float r;
uniform float g;
uniform float b;
uniform float pass;

void main(void){
  float x = UV.x * ratio;
  float y = UV.y;
  
  vec4 bg = vec4(r,g,b,1.0);
  vec4 col = texture2D(in_tex, lastUV);
  
  col.a *= clamp(abs(pass - 1.0), 0.0, 1.0); // If first pass: use 0 as alpha

  col.a = clamp(col.a, 0.0, 1.0);
  col = (1.0 - col.a) * bg + col.a * col;
  gl_FragColor = col;
}

