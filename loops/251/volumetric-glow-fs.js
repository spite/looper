const fs = `
precision highp float;

uniform vec3 color;
uniform float strength;

varying float vRim;

void main() {
  gl_FragColor = vec4(color, strength * vRim);
}`;

export { fs };