const vs = `
precision highp float;

attribute vec3 position;
attribute float color;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

uniform float size;

varying float vDepth;
varying float vColor;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  float l = length(cameraPosition);
  vDepth = abs(-mvPosition.z-l) / abs(l);
  vDepth = .1+ .9*vDepth;
  float fog = 1.-.2*(abs(-mvPosition.z) / l);
  vColor = .1* color*fog;
  gl_PointSize = exp(vDepth) * size * ( 300.0 / -mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
}
`;

export { vs };