precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D in_tex;
uniform vec2 mouse;
uniform float ratio, time;
uniform float offset;
uniform float boost;
uniform sampler2D tex_in;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
    vec2 p = vec2(x,y) - vec2(0.5 * ratio, 0.5);

    vec4 current = texture2D(tex_in, lastUV);
    vec4 a = texture2D(tex_in, lastUV + vec2(offset, 0.0));
    vec4 b = texture2D(tex_in, lastUV + vec2(-offset, 0.0));
    vec4 c = texture2D(tex_in, lastUV + vec2(0.0, offset));
    vec4 d = texture2D(tex_in, lastUV + vec2(0.0, -offset));
    
    vec4 col = abs(current - 0.25 * (a + b + c + d));

    col = clamp(col, vec4(0.0), vec4(1.0));

	col *= boost;
	
	col.a = clamp(length(col.rgba), 0.0, 1.0);
    gl_FragColor = col;
}

