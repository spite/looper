const vs = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

varying vec2 vUv;
varying vec4 worldPos;
varying vec3 vNormal;
varying float vDir;

void main() {
  vUv = uv;
  worldPos = modelMatrix*vec4( position, 0. );
  vNormal = normalMatrix * normal;
  vDir = dot(normalize(vNormal), -normalize((modelViewMatrix * vec4( position, 1. )).xyz));
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1. );
}`;

export { vs };