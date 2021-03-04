/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D previous_layer;
uniform sampler2D previous_previous_layer;
uniform vec2 mouse;
uniform float ratio, time, relativeTime;

void main(void){
  float x = UV.x * ratio;
  float y = UV.y;
  vec2 p = vec2(x,y) -
           vec2(0.5 * ratio, 0.5);

  vec4 last = texture2D(previous_layer, lastUV);
  vec4 lastlast = texture2D(previous_previous_layer, lastUV);

  float fac = 0.0;

  float t = relativeTime;
  t = clamp(t, 0.0, 1.0);

  fac += 1.0 - (p.x + 0.5 - 2.0 * t)/0.01;

  fac = clamp(fac, 0.0, 1.0);

  fac *= last.a;

  vec4 col = fac * last + (1.0 - fac)  * lastlast;

  gl_FragColor = col;
}
