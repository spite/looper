import vignette from '../../shaders/vignette.js';
import fxaa from '../../shaders/fxaa.js';
import softLight from '../../shaders/soft-light.js';
import screen from '../../shaders/screen.js';
import { gammaCorrect, levelRange, finalLevels } from '../../shaders/levels.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform float vignetteBoost;
uniform float vignetteReduction;

varying vec2 vUv;
${vignette}
${fxaa}
${softLight}
${screen}
${gammaCorrect}
${levelRange}
${finalLevels}

void main() {
  vec4 color = fxaa(inputTexture, vUv);
  vec4 v = vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.);
  vec4 finalColor = softLight(color, v);
  finalColor.rgb = finalLevels(finalColor.rgb, vec3(25./255.), vec3(1.49), vec3(229./255.));
  finalColor = screen(finalColor,finalColor,.5);
  gl_FragColor = finalColor;
}
`;

export { fs };