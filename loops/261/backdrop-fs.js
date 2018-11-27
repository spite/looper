const fs = `
precision highp float;

uniform vec3 brightColor;
uniform vec3 darkColor;

varying vec2 vUv;

void main() {
  float c = vUv.y;
  gl_FragColor = vec4(mix(darkColor, brightColor, c),1.);
}
`;

export { fs };