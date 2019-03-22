precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D previous_pass;
uniform sampler2D previous_scene;
uniform vec2 mouse;
uniform float ratio, time, relativeTime;

void main(void){
  float x = UV.x * ratio;
  float y = UV.y;
  vec2 p = vec2(x,y) - 
           vec2(0.5 * ratio, 0.5);
  
  vec4 tex = texture2D(previous_pass, lastUV);
  vec4 col = tex;
  col.r *= 0.2 * tan(p.x * 4.0 + p.y * 1.0 + 0.2 * cos(p.y * 10.0) + 0.01 * tan(p.y * 2.0 + time * 6.2832) + relativeTime * 6.2832) + 0.6;
  col.r -= 0.1;
  col.r = clamp(col.r, 0.0, 1.0);
  col.r = col.r * 0.9 + tex.r * 0.3;

  gl_FragColor = col;
}
