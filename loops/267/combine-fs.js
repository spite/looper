import screen from '../../shaders/screen.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform sampler2D blurTexture;

varying vec2 vUv;

${screen}

void main() {
  vec4 color = texture2D(inputTexture, vUv);
  vec4 blur = texture2D(blurTexture, vUv);
  gl_FragColor = screen(.2+.8*color, blur, 1.);
}
`;

export { fs };