const fs = `
precision highp float;

uniform float maxDistance;
uniform vec3 color;
uniform float strength;
uniform float spread;

varying float vFalloff;
varying vec3 e;
varying vec3 n;

void main() {
  float softEdge = pow(abs(dot(normalize(e), normalize(n))),spread);
  float opacity =vFalloff*softEdge;
  gl_FragColor = vec4(color,strength * opacity);
}`;

export { fs };