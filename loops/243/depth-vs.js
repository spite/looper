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
varying vec3 vNormal;
varying float light;

void main() {
  vec4 p = vec4( position, 1. );

  vec3 e = normalize( -vec3( modelViewMatrix * p ) );
  vec3 n = normalize( normalMatrix * normal );
  vDot = dot(e,n);
  vNormal = n;

  light = dot(n,normalize(vec3(1.,1.,1.)));
  gl_Position = projectionMatrix * modelViewMatrix * p;
}`;

export { vs };