/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

varying vec2 UV;
varying vec2 lastUV;
uniform sampler2D in_tex;
uniform vec2 mouse;
uniform float ratio, time;
uniform float imageWidth, imageHeight, imageScale, offsetTop, offsetLeft;
uniform sampler2D image;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
    vec2 p = vec2(x,y) - vec2(0.5 * ratio, 0.5);

    vec2 imageUV = UV * vec2(1.0, -1.0) + vec2(0.0, 1.0);
    vec4 image = texture2D(image, imageUV);
    vec4 last = texture2D(in_tex, lastUV);

	//vec4 col = (1.0 - image.a) * last + image.a * image;
    vec4 col = image + (1.0 - image.a) * last;

    gl_FragColor = col;
}
