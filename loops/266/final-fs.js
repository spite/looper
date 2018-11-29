import vignette from '../../shaders/vignette.js';
import softLight from '../../shaders/soft-light.js';
import screen from '../../shaders/screen.js';
import { gammaCorrect, levelRange, finalLevels } from '../../shaders/levels.js';
import { barrel } from '../../shaders/barrel.js';

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
${barrel}

void main() {
  float zoom = 1.;
  vec4 color = barrel(inputTexture, zoom*vUv,.5,1.,resolution, vec4(194.,87.,213.,255.)/255.);
  vec4 v = vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.);
  vec4 finalColor = softLight(color, v);
  finalColor.rgb = finalLevels(finalColor.rgb, vec3(17. / 255.), vec3(1.), vec3(255. / 255.));
  finalColor = screen(finalColor,finalColor,.5);
  gl_FragColor = finalColor;
}
`;

export { fs };