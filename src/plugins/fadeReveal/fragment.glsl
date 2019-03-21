precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D previous_pass;
uniform sampler2D previous_scene;
uniform vec2 mouse;
uniform float ratio, time, relativeTime, transitionTime;
uniform float logoWidth, logoHeight, logoScale;
uniform sampler2D logo;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
	vec2 p = vec2(x,y) - vec2(0.5 * ratio, 0.5);
	
	vec4 last = texture2D(previous_pass, lastUV);
	vec4 previous = texture2D(previous_scene, lastUV);
	float fac = clamp(relativeTime/transitionTime, 0.0, 1.0);
	vec4 col = last * fac + (1.0 - fac) * previous;

	gl_FragColor = col;
}
