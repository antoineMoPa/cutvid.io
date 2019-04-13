/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

/* sideReveal */

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D previous_pass;
uniform sampler2D previous_scene;
uniform vec2 mouse;
uniform float ratio, time, relativeTime;
uniform float transitionTime, sideWays, direction;

void main(void){
  float x = UV.x * ratio;
  float y = UV.y;
  vec2 p = vec2(x,y) -
           vec2(0.5 * ratio, 0.5);

  vec4 lastScene = texture2D(previous_scene, lastUV);
  vec4 lastPass = texture2D(previous_pass, lastUV);

  float position = p.x;

  position -= sideWays * p.y;
  position /= 1.0 + sideWays;

  float fac = 1.0 - (2.0 * relativeTime/transitionTime - direction * position - 1.0)/0.004;

  fac = clamp(fac, 0.0, 1.0);

  vec4 col = lastScene * fac + (1.0 - fac) * lastPass;

  gl_FragColor = col;
}
