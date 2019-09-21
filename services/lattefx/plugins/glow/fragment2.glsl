/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D previous_pass, previous_layer;
uniform vec2 mouse;
uniform float ratio, time, relativeTime;
uniform float intensity, size, modulation;
uniform float xModulation, yModulation, boost;
uniform float rMult, gMult, bMult;


#define SIZE 3
#define low_pass_size 3


void main(void){
  float x = UV.x * ratio;
  float y = UV.y;
  vec2 p = vec2(x,y) -
           vec2(0.5 * ratio, 0.5);

  vec2 spacing = vec2(size);

  int count = 0;
  vec4 sum = vec4(0.0);

  // Low Pass Filter
  for(int i = -low_pass_size; i < low_pass_size; i++){
    for(int j = -low_pass_size; j < low_pass_size; j++){
      vec2 offset = spacing * vec2(float(i), float(j)) * 1.5;
      sum += texture2D(previous_pass, lastUV + offset);
      count++;
    }
  }

  vec4 blur = 1.0/float(count) * sum;
  vec4 original = texture2D(previous_layer, lastUV);
  float fac = intensity;
  fac += modulation * pow(length(original.rgb), 2.0) * cos(relativeTime * 6.2832 - p.x * xModulation - p.y * yModulation);
  blur = fac * sum / float(count) * vec4(rMult, gMult, bMult, 1.0);

  fac = intensity / length(original.rgb);
  original *= boost;
  vec4 col = fac * blur + (1.0 - fac) * original;

  gl_FragColor = col;
}
