precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D previous_pass;
uniform sampler2D previous_scene;
uniform vec2 mouse;
uniform float ratio, time, relativeTime;
uniform float strength, lineDensity, verticalGlitch, verticalDensity, distort;

void main(void){
  float x = UV.x * ratio;
  float y = UV.y;
  vec2 p = vec2(x,y) -
           vec2(0.5 * ratio, 0.5);

  float redglitch = 0.2 *
    tan(
        p.x * lineDensity + p.y * 1.0 +
        0.2 * cos(p.y * 10.0) +
        verticalGlitch * 0.02 *
        tan(p.y * verticalDensity + p.x * 0.2 + time * 6.2832) +
        relativeTime * 6.2832
        ) + 0.6;

  vec2 uv = lastUV;
  uv.x += 0.1 * distort * redglitch;

  vec4 tex = texture2D(previous_pass, uv);
  tex.a = 1.0;
  vec4 col = tex;

  col.r *= redglitch;
  col.r -= 0.1;
  col.r = clamp(col.r, 0.0, 1.0);
  col.r = col.r * strength + tex.r * (1.0 - strength);

  gl_FragColor = col;
}
