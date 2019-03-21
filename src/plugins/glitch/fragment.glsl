precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D in_tex;
uniform vec2 mouse;
uniform float ratio, time, relativeTime;
uniform float strength, displace;
uniform sampler2D previous_pass;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
    vec2 p = vec2(x,y) - vec2(0.5 * ratio, 0.5);
    float offset = strength * 0.01;

    offset += displace / 100.0 * cos(time * 6.2832 + p.x * 10.0);

    // Attenuate
    offset = offset * (1.0 - relativeTime);

    vec4 col = texture2D(previous_pass, lastUV);
    vec4 col1 = texture2D(previous_pass, lastUV + vec2(offset, offset));
    vec4 col2 = texture2D(previous_pass, lastUV + vec2(offset, -offset));
    vec4 col3 = texture2D(previous_pass, lastUV + vec2(-offset, 0.0));

    col = vec4(col1.r, col2.g, col3.b, col.a);

    col.a = 1.0;

    gl_FragColor = col;
}
