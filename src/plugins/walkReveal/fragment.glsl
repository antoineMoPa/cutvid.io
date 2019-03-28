/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D previous_pass;
uniform sampler2D previous_previous_pass;
uniform vec2 mouse;
uniform float ratio, time, relativeTime;
uniform float walkDimension;

void main(void){
  float x = UV.x * ratio;
  float y = UV.y;
  vec2 p = vec2(x,y) -
           vec2(0.5 * ratio, 0.5);

  vec4 last = texture2D(previous_pass, lastUV);
  vec4 lastlast = texture2D(previous_previous_pass, lastUV);

  float fac = 0.0;

  vec2 p2;
  p2 = fract(p * walkDimension) - 0.5;

  float a = atan(p2.y,p2.x);

  p.x += a * 0.2;

  fac += 1.0 - (p.x + 2.0 - 4.0 * relativeTime)/0.01;

  fac += a * 2.0;
  fac += p2.x;
  fac += p2.y;
  fac = clamp(fac, 0.0, 1.0);

  fac *= last.a;

  vec4 col = fac * last + (1.0 - fac)  * lastlast;

  gl_FragColor = col;
}
