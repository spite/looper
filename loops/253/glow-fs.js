const fs = `
precision highp float;

uniform float max;

varying vec3 vPosition;

void main() {
  float d = clamp(1.-length(vPosition)/max,0.,1.);
  d = pow(d,2.);
  gl_FragColor = vec4(1.,1.,1.,d);
}`;

export { fs };