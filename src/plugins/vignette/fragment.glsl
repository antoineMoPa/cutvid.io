precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D in_tex;
uniform vec2 mouse;
uniform float ratio, time;
uniform float strength;
uniform sampler2D tex_in;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
	vec2 p = vec2(x,y) - vec2(0.5 * ratio, 0.5);
	
	vec4 col = texture2D(tex_in, lastUV);
	col *= 1.0 - strength * pow(length(p), 2.0);
	col.a = 1.0;

	gl_FragColor = col;
}

