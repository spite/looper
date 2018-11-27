import fxaa from '../../shaders/fxaa.js';
import { gammaCorrect, levelRange, finalLevels } from '../../shaders/levels.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;

varying vec2 vUv;
${fxaa}
${gammaCorrect}
${levelRange}
${finalLevels}

void main() {
  vec4 color = fxaa(inputTexture, vUv);
  gl_FragColor = vec4(finalLevels(color.rgb, vec3(48.,32.,13.)/255., vec3(1.), vec3(254.,178.,191.)/255.),1.);
}
`;

export { fs };