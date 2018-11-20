const vs = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform float max;
uniform float radius;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat3 normalMatrix;

varying vec2 vUv;
varying float d;

void main() {
  vUv = uv;
  d = 1.-pow((length(position)-radius)/max,.5);
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * mvPosition;
}
`;

export { vs };