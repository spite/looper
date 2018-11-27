import highPass from '../../shaders/high-pass.js';
import overlay from '../../shaders/overlay.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;

varying vec2 vUv;

${highPass}
${overlay}

void main() {
  vec4 c = texture2D(inputTexture, vUv);
  vec4 h = highPass(inputTexture, vUv);
  c = overlay(c,h,1.);
  gl_FragColor = c;
}
`;

export { fs };