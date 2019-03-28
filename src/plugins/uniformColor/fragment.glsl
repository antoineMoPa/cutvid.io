precision highp float;

uniform float r;
uniform float g;
uniform float b;

void main(void){
  vec4 bg = vec4(r,g,b,1.0);
  gl_FragColor = bg;
}

