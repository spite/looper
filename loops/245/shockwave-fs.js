const fs = `
precision highp float;

#define M_PI 3.1415926535897932384626433832795

varying vec3 vNormal;

void main() {
  gl_FragColor = vec4(.5+.5*vNormal,1.);
}
`;

export { fs };