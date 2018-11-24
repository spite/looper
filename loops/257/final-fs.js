import vignette from '../../shaders/vignette.js';
import fxaa from '../../shaders/fxaa.js';
import softLight from '../../shaders/soft-light.js';
import screen from '../../shaders/screen.js';
import { gammaCorrect, levelRange, finalLevels } from '../../shaders/levels.js';
import radialBlur from '../../shaders/radial-blur.js';

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
${radialBlur}

void main() {
  vec4 color = texture2D(inputTexture, vUv);
  vec4 finalColor = softLight(color, vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.));
  finalColor.rgb = finalLevels(finalColor.rgb, vec3(38.,5.,0.)/255., vec3(1.,.96,1.08), vec3(216.,248.,239.)/255.);
  finalColor = screen(finalColor,finalColor,1.);
  gl_FragColor = finalColor;
}
`;

export { fs };