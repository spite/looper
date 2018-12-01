const vs = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

varying vec2 vUv;
varying float vDepth;
varying float vDepthCenter;

void main() {
  vUv = position.zy;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1. );
  gl_Position = projectionMatrix * mvPosition;
  vDepth = clamp( ( gl_Position.z - 4. ) / 16., 0., 1. );
  float l = length(cameraPosition);
  vDepthCenter = pow(1.-abs(length(mvPosition.xyz)-l) / abs(l),2.);
}
`;

export { vs };
