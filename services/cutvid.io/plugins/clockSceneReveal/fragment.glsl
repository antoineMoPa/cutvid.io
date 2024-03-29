/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D previous_layer;
uniform sampler2D previous_previous_layer;
uniform vec2 mouse;
uniform float ratio, time, relativeTime;
uniform sampler2D logo;

void main(void){
  float x = UV.x * ratio;
  float y = UV.y;
  vec2 p = vec2(x,y) - vec2(0.5 * ratio, 0.5);

  float d = length(p);
  float a = -atan(p.y, p.x);

  vec4 tex = texture2D(previous_layer,  lastUV);
  float t = clamp(relativeTime, 0.0, 1.0);
  float revealedAngle = (-3.1416 + 6.2832 * t);

  float blendFac = clamp((revealedAngle - a)/0.1, 0.0, 1.0) * tex.a;

  if(relativeTime > 1.0){
	blendFac = 1.0;
  }

  vec4 col = texture2D(previous_previous_layer, lastUV);
  col = blendFac * tex + (1.0 - blendFac) * col;

  gl_FragColor = col;
}
