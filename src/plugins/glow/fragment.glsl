/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D previous_pass;
uniform vec2 mouse;
uniform float ratio, time, relativeTime;
uniform float intensity, size, modulation;
uniform float xModulation, yModulation;
uniform float rMult, gMult, bMult;


#define SIZE 4

void main(void){
  float x = UV.x * ratio;
  float y = UV.y;
  vec2 p = vec2(x,y) -
           vec2(0.5 * ratio, 0.5);

  vec4 last = texture2D(previous_pass, lastUV);
  vec4 col = last;
  vec4 sum = vec4(0.0);
  float offset = size;

  for(int step = 0; step < 4; step++){
    for(int i = -SIZE; i < SIZE; i++){
      for(int j = -SIZE; j < SIZE; j++){
        vec2 voffset = vec2(float(i) * offset, float(j) * offset);

        sum += 1.0/float(step+1) * texture2D(previous_pass, lastUV + voffset);
      }
    }
    offset = pow(offset, 1.04);
  }

  float fac = intensity;
  fac += modulation * cos(time * 6.2832 - p.x * xModulation - p.y * yModulation);
  col += fac * sum / float(SIZE * SIZE * 4) * vec4(rMult, gMult, bMult, 1.0);

  gl_FragColor = col;
}
