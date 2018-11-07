const vs = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat3 normalMatrix;

uniform float showNormals;

varying vec4 vColor;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  if(showNormals==1.) {
    vColor.rgb = normal;
  } else {
    vColor.xyz = position.xyz;
  }
  gl_Position = projectionMatrix * mvPosition;
}
`;

export { vs };