/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

varying vec2 UV;
varying  vec2 lastUV;
uniform sampler2D previous_layer;
uniform vec2 mouse;
uniform float ratio, time;
uniform float imageWidth, imageHeight, imageScale, offsetTop, offsetLeft;
uniform sampler2D image;
uniform float r;
uniform float g;
uniform float b;


void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
    vec2 p = vec2(x,y) - vec2(0.5 * ratio, 0.5);

    vec2 imageUV = UV * vec2(1.0, -1.0) + vec2(0.0, 1.0);
    float imageRatio = imageHeight / imageWidth * ratio;
    // Apply aspect ratio
    imageUV.x *= imageRatio;

    // Apply scale
    imageUV.x -= offsetLeft;
    imageUV.y -= offsetTop;
    imageUV *= 1.0/imageScale;

    vec4 image = texture2D(image, imageUV);

	// Remove parts outside UV
    image *= 1.0 - step(1.0, imageUV.x);
    image *= 1.0 - step(1.0, imageUV.y);
    image *= step(0.0, imageUV.x);
    image *= step(0.0, imageUV.y);

	float opacity = clamp(image.r + image.g + image.b, 0.0, 1.0);

    vec4 last = texture2D(previous_layer, lastUV);
	vec4 mask_col = vec4(r,g,b,1.0);
    vec4 col = mask_col * opacity + (1.0 - opacity) * last;

    gl_FragColor = col;
}
