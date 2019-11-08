/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

varying  vec2 lastUV;

uniform sampler2D previous_layer;

uniform float r;
uniform float g;
uniform float b;

uniform float r_exp;
uniform float g_exp;
uniform float b_exp;


void main(void){
  vec4 last = texture2D(previous_layer, lastUV);

  vec4 col = vec4(0.0);

  col.r = pow(last.r * r, r_exp);
  col.g = pow(last.g * g, g_exp);
  col.b = pow(last.b * b, b_exp);

  col.a = last.a;

  gl_FragColor = col;
}
