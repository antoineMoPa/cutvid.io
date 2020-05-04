/* If you change this, please change it in the
   sequence_effects component too. */
/* Thank you, have a nice day. */

attribute vec3 position;

varying vec2 UV;
varying vec2 lastUV;
varying vec3 v_position;
varying mat2 rot_mat;
uniform vec2 renderBufferRatio;
uniform float rotate_angle, ratio;

void main(){

  v_position = position * vec3(1.0, 1.0, 1.0);

  float rad = rotate_angle / 180.0 * 3.141542069;

  rot_mat = mat2(cos(rad), -sin(rad),
                 sin(rad),  cos(rad));

  UV = vec2((position.x+1.0) / 2.0, (position.y + 1.0)/2.0);

  lastUV = UV / renderBufferRatio;
  gl_Position = vec4(v_position.x,v_position.y, 0.0, 1.0);
}
