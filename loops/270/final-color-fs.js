import fxaa from '../../shaders/fxaa.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;

varying vec2 vUv;
${fxaa}

void main() {
  vec4 color = fxaa(inputTexture, vUv);
  gl_FragColor = color;
}
`;

export { fs };