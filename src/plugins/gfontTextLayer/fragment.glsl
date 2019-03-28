/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D in_tex;
uniform vec2 mouse;
uniform float ratio, time;
uniform float strength;
uniform sampler2D texture0;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
    vec2 p = vec2(x,y) - vec2(0.5 * ratio, 0.5);

    vec2 texUV = UV * vec2(1.0, -1.0) + vec2(0.0, 1.0);
    vec4 col = texture2D(texture0, texUV);
    vec4 last = texture2D(in_tex, lastUV);

    col = (1.0 - col.a) * last + col.a * col;
    col.a = clamp(col.a, 0.0, 1.0);
    gl_FragColor = col;
}
