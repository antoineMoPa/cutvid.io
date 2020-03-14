precision highp float;

varying vec2 UV;
varying vec2 lastUV;
uniform sampler2D previous_layer;
uniform sampler2D previous_previous_layer;
uniform vec2 mouse;
uniform float ratio, time, relativeTime;
uniform float angle;
uniform sampler2D logo;

void main(void){
  float a = angle / 180.0 * 3.141542069;

  vec2 offset = lastUV/UV*0.5;
  vec2 uv = lastUV - offset;

  uv *= mat2(cos(a), -sin(a), sin(a), cos(a));

  uv += offset;

  float clamper = 0.0;

  clamper += clamp((offset.x*2.0-uv.x)/0.003,0.0,1.0);
  clamper *= 1.0-clamp(1.0-uv.x/0.003,0.0,1.0);
  clamper *= clamp((offset.y*2.0-uv.y)/0.003,0.0,1.0);
  clamper *= 1.0-clamp(1.0-uv.y/0.003,0.0,1.0);

  vec4 tex = texture2D(previous_layer, uv);
  vec4 col = tex * clamper + vec4(0.0,0.0,0.0,1.0) * (1.0 - clamper);

  gl_FragColor = col;
}
