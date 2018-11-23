import vignette from '../../shaders/vignette.js';
import fxaa from '../../shaders/fxaa.js';
import softLight from '../../shaders/soft-light.js';
import screen from '../../shaders/screen.js';
import { gammaCorrect, levelRange, finalLevels } from '../../shaders/levels.js';
import radialBlur from '../../shaders/radial-blur.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D blur1Texture;
uniform sampler2D blur2Texture;
uniform sampler2D blur3Texture;
uniform sampler2D blur4Texture;
uniform sampler2D blur5Texture;

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
  vec4 color = fxaa(inputTexture, vUv);
  color.rgb = mix(vec3(.2,.1,.05), color.rgb, color.a);

  vec4 bloom = vec4(0.);
  bloom += 1. * texture2D( blur1Texture, vUv );
  bloom += 1.2 * texture2D( blur2Texture, vUv );
  bloom += 1.4 * texture2D( blur3Texture, vUv );
  bloom += 1.6 * texture2D( blur4Texture, vUv );
  bloom += 1.8 * texture2D( blur5Texture, vUv );

  color += .5*bloom;

  vec4 finalColor = softLight(color, vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.));
  //finalColor = screen(finalColor, rBlur,.5);
  finalColor.rgb = finalLevels(finalColor.rgb, vec3(21./255.), vec3(1.), vec3(1.));
  finalColor = screen(finalColor,finalColor,1.);
  gl_FragColor = finalColor;
}
`;

export { fs };