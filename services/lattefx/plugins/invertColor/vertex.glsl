/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
attribute vec3 position;

varying vec2 UV;
varying vec2 lastUV;
varying vec3 v_position;
uniform vec2 renderBufferRatio;

void main(){
    v_position = position;
    UV = vec2((position.x+1.0) / 2.0, (position.y + 1.0)/2.0);
	lastUV = UV / renderBufferRatio;
    gl_Position = vec4(v_position.x,v_position.y, 0.0, 1.0);
}

