import rgbShift from '../../shaders/rgb-shift.js';
import { gammaCorrect, levelRange, finalLevels } from '../../shaders/levels.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;

varying vec2 vUv;
${rgbShift}
${gammaCorrect}
${levelRange}
${finalLevels}

void main() {
  vec4 color = rgbShift(inputTexture, vUv, vec2(30.));
  gl_FragColor = vec4(finalLevels(color.rgb, vec3(12.)/255., vec3(1.18), vec3(217.)/255.),1.);
}
`;

export { fs };