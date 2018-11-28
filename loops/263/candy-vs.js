const vs = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying float vDepth;

void main() {
  vPosition = position;
  vNormal = normal;
  vUv = uv;
  vWorldPosition = (modelMatrix * vec4(position,1.)).xyz;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  vViewPosition = -mvPosition.xyz;
  float l = .5*length(cameraPosition);
  vDepth = clamp(1.-(-mvPosition.z-l) / l,0.,1.);
  gl_Position = projectionMatrix * mvPosition;

}`;

export { vs };