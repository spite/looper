import rgbShift from '../../shaders/rgb-shift.js';
import screen from '../../shaders/screen.js';
import radialBlur from '../../shaders/radial-blur.js';
import { gammaCorrect, levelRange, finalLevels } from '../../shaders/levels.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;

varying vec2 vUv;
${rgbShift}
${screen}
${radialBlur}
${gammaCorrect}
${levelRange}
${finalLevels}

void main() {
  vec4 rBlur = radialBlur(inputTexture,vec2(.5)*resolution,1.,resolution, vUv);
  vec4 color = rgbShift(inputTexture, vUv, vec2(40.));
  color = screen(color, rBlur,.5);
  color.rgb = finalLevels(color.rgb, vec3(64.,0.,0.)/255., vec3(1.), vec3(1.));
  gl_FragColor = color;
}
`;

export { fs };