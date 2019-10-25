/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

uniform float fgr;
uniform float fgg;
uniform float fgb;
uniform sampler2D previous_layer;

uniform sampler2D mask;
varying vec2 UV;
varying  vec2 lastUV;


void main(void){
  vec4 fg = vec4(fgr,fgg,fgb,1.0);
  vec2 imageUV = UV * vec2(1.0, -1.0) + vec2(0.0, 1.0);
  vec4 m = vec4(1.0) - texture2D(mask, imageUV);
  vec4 tex = texture2D(previous_layer,  lastUV);
  vec4 col = tex * (m.a) + fg * (1.0 - m.a);
  col.a = 1.0;
  gl_FragColor = col;
}
