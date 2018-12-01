import vignette from '../../shaders/vignette.js';
import softLight from '../../shaders/soft-light.js';
import screen from '../../shaders/screen.js';
import { gammaCorrect, levelRange, finalLevels } from '../../shaders/levels.js';
import fxaa from '../../shaders/fxaa.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform float vignetteBoost;
uniform float vignetteReduction;

varying vec2 vUv;
${vignette}
${softLight}
${screen}
${gammaCorrect}
${levelRange}
${finalLevels}
${fxaa}

void main() {
  vec4 color = fxaa(inputTexture, vUv);
  vec4 v = vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.);
  vec4 finalColor = softLight(color, v);
  finalColor.rgb = finalLevels(finalColor.rgb, vec3(0.) / 255., vec3(1.49), vec3(255.)/ 255.);
  gl_FragColor = finalColor;
}
`;

export { fs };