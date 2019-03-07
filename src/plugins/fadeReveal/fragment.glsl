precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D previous_pass;
uniform sampler2D previous_previous_pass;
uniform vec2 mouse;
uniform float ratio, time, relativeTime;
uniform float logoWidth, logoHeight, logoScale;
uniform sampler2D logo;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
	vec2 p = vec2(x,y) - vec2(0.5 * ratio, 0.5);
	
	vec4 last = texture2D(previous_pass, lastUV);
	vec4 previous = texture2D(previous_previous_pass, lastUV);
	float fac = relativeTime;
	vec4 col = last * fac + (1.0 - fac) * previous;

	gl_FragColor = col;
}
