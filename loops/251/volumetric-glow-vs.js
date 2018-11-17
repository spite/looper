const vs = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat3 normalMatrix;

uniform float spread;

varying float vRim;

void main() {
  vec3 e = normalize( vec3( modelViewMatrix * vec4( position, 1.0 ) ) );
  vec3 n = normalize( normalMatrix * normal );
  vRim = 50.*position.z * pow(abs(dot(e,n)),spread);
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * mvPosition;
}
`;

export { vs };