import vignette from '../../shaders/vignette.js';
import fxaa from '../../shaders/fxaa.js';
import softLight from '../../shaders/soft-light.js';
import screen from '../../shaders/screen.js';

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

void main() {
  vec4 color = fxaa(inputTexture, vUv);
  float l = length(vUv - .5);
  color.rgb = mix(color.rgb, vec3(229., 106., 77.)/255., clamp(smoothstep(.6,.8,l), 0., 1.));
  vec4 v = vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.);
  vec4 finalColor = softLight(color, v);
  finalColor = screen(finalColor,finalColor,1.);
  gl_FragColor = finalColor;
}
`;

export { fs };