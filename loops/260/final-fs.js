import vignette from '../../shaders/vignette.js';
import fxaa from '../../shaders/fxaa.js';
import softLight from '../../shaders/soft-light.js';
import screen from '../../shaders/screen.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform sampler2D shadeTexture;
uniform float vignetteBoost;
uniform float vignetteReduction;

varying vec2 vUv;
${vignette}
${fxaa}
${softLight}
${screen}

void main() {
  vec4 color = texture2D(inputTexture, vUv);
  vec4 shade = texture2D(shadeTexture, vUv);
  color *= shade;
  vec4 v = vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.);
  vec4 finalColor = softLight(color, v);
  finalColor = screen(finalColor,finalColor,1.);
  gl_FragColor = finalColor;
}
`;

export { fs };