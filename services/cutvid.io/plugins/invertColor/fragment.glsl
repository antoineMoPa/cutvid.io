/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

varying  vec2 lastUV;

uniform sampler2D previous_layer;

void main(void){
  vec4 last = texture2D(previous_layer, lastUV);

  vec4 col = last;

  col.rgb = vec3(1.0) - col.rgb;

  gl_FragColor = col;
}
