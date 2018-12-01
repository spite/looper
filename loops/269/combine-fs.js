const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform sampler2D gradientTexture;

varying vec2 vUv;

void main() {
  vec4 color = texture2D(inputTexture, vUv);
  vec4 gradient = texture2D(gradientTexture, vUv);
  color += .1*gradient.r;
  color +=.1* gradient.b;
  gl_FragColor = color;
}
`;

export { fs };