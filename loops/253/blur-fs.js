import { blur13 } from '../../shaders/fast-separable-gaussian-blur.js';

const fs = `
precision highp float;

uniform vec2 resolution;
uniform sampler2D inputTexture;
uniform vec2 direction;

varying vec2 vUv;

${blur13}

void main() {
  gl_FragColor = blur13(inputTexture, vUv, resolution, direction);
}`;

export { fs };