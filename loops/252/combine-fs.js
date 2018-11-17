import screen from '../../shaders/screen.js';

const fs = `
precision highp float;

uniform sampler2D colorTexture;
uniform sampler2D blurTexture;

varying vec2 vUv;

${screen}

void main() {
  vec4 c = texture2D(colorTexture, vUv);
  vec4 b = texture2D(blurTexture, vUv);
  gl_FragColor = screen(c,b*c.a,1.) + vec4(51.,42., 33., 255.)/128.*(1.-c.a);
}`;

export { fs };