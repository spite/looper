const vs = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

varying vec2 vUv;

void main() {
  vec4 p = vec4( position, 1. );
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * p;
}`;

export { vs };