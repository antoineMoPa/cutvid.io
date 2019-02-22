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
	
	gl_FragColor = col;
}

