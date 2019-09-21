/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

uniform float r;
uniform float g;
uniform float b;

void main(void){
  vec4 bg = vec4(r,g,b,1.0);
  gl_FragColor = bg;
}

