const fs = `
precision highp float;

varying float vDot;
varying vec3 vNormal;
varying float light;

void main() {
  float far = 5.;
  float near = .1;
  float z = gl_FragCoord.z;
  float ndcZ = 2.0*z - 1.0;
  float linearDepth = (2.0 * near * far) / (far + near - ndcZ * (far - near));
  gl_FragColor = vec4(linearDepth,vDot,light,1.);
}
`;

export { fs };