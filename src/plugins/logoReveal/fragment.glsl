precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D in_tex;
uniform vec2 mouse;
uniform float ratio, time;
uniform float logoWidth, logoHeight, logoScale;
uniform sampler2D logo;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
	vec2 p = vec2(x,y) - vec2(0.5 * ratio, 0.5);
	
	vec4 last = texture2D(in_tex, lastUV);
	vec2 logoUV = UV * vec2(1.0, -1.0) + vec2(0.0, 1.0);
	float logoRatio = logoHeight / logoWidth * ratio;
	// Apply aspect ratio
	logoUV.x *= logoRatio;
	// Center in X
	logoUV.x += (1.0 - logoRatio)/2.0;
	
	// Apply scale
	logoUV -= 0.5;
	logoUV *= 1.0/logoScale;
	logoUV += 0.5;
	
	vec4 logo = texture2D(logo, logoUV);
	
	// Remove parts outside UV
	logo *= 1.0 - step(1.0, logoUV.x);
	logo *= 1.0 - step(1.0, logoUV.y);
	logo *= step(0.0, logoUV.x);
	logo *= step(0.0, logoUV.y);
	
	vec4 col = (1.0 - logo.a) * last + logo.a * logo;
	
	gl_FragColor = col;
}
