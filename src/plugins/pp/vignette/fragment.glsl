#version 300 es
precision highp float;

in vec2 UV;
in  vec2 lastUV;
uniform vec2 mouse;
out vec4 out_color;
uniform float ratio, time;
uniform sampler2D tex_in;
uniform sampler2D texture0;

uniform float strength;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
	vec2 p = vec2(x,y) - vec2(0.5 * ratio, 0.5);
	
	vec4 col = texture(tex_in, lastUV);	
	vec2 uv = UV * vec2(1.0, -1.0) + vec2(0.0, 1.0);
	col *= 1.0 - 1.0 * pow(length(p), 2.0);
	
    col.a = 1.0;
	
    out_color = col;
}

