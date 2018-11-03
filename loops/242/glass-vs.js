const vs = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

varying float vDot;
varying vec2 vUv;
varying vec2 vUvReflect;
varying vec2 vUvRefract;

void main() {
  vUv = uv;
  vec4 p = vec4( position, 1. );

  vec3 e = normalize( vec3( modelViewMatrix * p ) );
  vec3 n = normalize( normalMatrix * normal );
  vDot = dot(e,n);

  vUvReflect = .2*reflect(e,n).xy;
  vUvRefract = .2*refract(e,n,.9).xy;

gl_Position = projectionMatrix * modelViewMatrix * p;
}
`;

export { vs };