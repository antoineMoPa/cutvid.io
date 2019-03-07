precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D tex_in;
uniform sampler2D previous_tex_in;
uniform vec2 mouse;
uniform float ratio, time;
uniform float logoWidth, logoHeight, logoScale;
uniform sampler2D logo;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
	vec2 p = vec2(x,y) - vec2(0.5 * ratio, 0.5);
	
	vec4 last = texture2D(tex_in, lastUV);
	vec4 previous = texture2D(previous_tex_in, lastUV);
	vec4 col = last + (1.0 - last.a) * previous;
	if(p.x < 0.5){
	  col = last;
	} else {
	  col = previous;
	}
	gl_FragColor = col;
}
