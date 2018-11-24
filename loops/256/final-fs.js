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
uniform sampler2D starsTexture;
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
  vec4 color = texture2D(inputTexture,vUv);
  vec4 stars = texture2D(starsTexture,vUv);
  vec4 rBlur = radialBlur(inputTexture,vec2(.5)*resolution,1.,resolution,vUv);
  color = screen(color, rBlur,.5);
  vec4 finalColor = screen(color, stars,1.);
  gl_FragColor = finalColor;
}
`;

export { fs };