/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

varying  vec2 lastUV;

uniform sampler2D previous_layer;

uniform float r;
uniform float g;
uniform float b;

uniform float transparency;


void main(void){
  vec4 bg = vec4(r,g,b,1.0);
  vec4 last = texture2D(previous_layer, lastUV);

  gl_FragColor = bg * (1.0 - transparency) + transparency * last;
}
