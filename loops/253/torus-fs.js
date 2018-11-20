const fs = `
precision highp float;

uniform sampler2D spaceTexture;

varying float rim;
varying vec3 e;
varying vec3 n;
varying vec3 vRefract;

#define PI 3.1415926535897932384626433832795

void main() {
  float yaw = .5 - atan( vRefract.z, - vRefract.x ) / ( 2.0 * PI );
  float pitch = .5 - asin( vRefract.y ) / PI;
  vec3 envColor = texture2D( spaceTexture, vec2( 1.-yaw, 1.-pitch ) ).rgb;

  gl_FragColor = vec4(rim*envColor.xyz,1.5*rim);
}`;

export { fs };