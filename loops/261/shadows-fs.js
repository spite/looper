import radialBlur from '../../shaders/radial-blur.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;

varying vec2 vUv;

${radialBlur}

void main() {
  vec4 rBlur = radialBlur(inputTexture,vec2(.5,2.)*resolution,.5,resolution, vUv);
  gl_FragColor = 1.- rBlur;
}
`;

export { fs };