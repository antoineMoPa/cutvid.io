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

  vec4 last = texture2D(previous_pass, lastUV);

  // example: Add color to last layer
  vec4 col = vec4(0.6,0.0,0.7,1.0) + last;

  gl_FragColor = col;
}
