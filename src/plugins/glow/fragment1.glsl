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


#define SIZE 3
#define high_freq_size 2


void main(void){
  float x = UV.x * ratio;
  float y = UV.y;
  vec2 p = vec2(x,y) -
           vec2(0.5 * ratio, 0.5);

  vec2 spacing = vec2(size);

  vec4 sum = vec4(0.0);

  int count = 0;

  for(int i = -high_freq_size; i < high_freq_size; i++){
    for(int j = -high_freq_size; j < high_freq_size; j++){
      int ii = i + int(1.3 * cos(float(i) + p.x + p.y));// + ((i | j) ^ (j & i)) * 8;
      int jj = j + int(1.3 * sin(float(j) + p.x + p.y));// + ((~j | i) ^ (j & i)) * 10;

      vec2 offset = spacing * vec2(float(ii), float(jj));
      // Equilibrate
      offset.x += spacing.x * 3.0;
      offset.y += spacing.y * 5.0;

      sum += texture2D(previous_pass, lastUV + offset);
      count++;
    }
  }

  vec4 col = sum / float(count);

  gl_FragColor = col;
}
