import screen from '../../shaders/screen.js';
import vignette from '../../shaders/vignette.js';
import fxaa from '../../shaders/fxaa.js';
import softLight from '../../shaders/soft-light.js';

const fs = `
precision highp float;

uniform sampler2D backTexture;
uniform sampler2D glowTexture;
uniform sampler2D blur1Texture;
uniform sampler2D blur2Texture;
uniform sampler2D blur3Texture;
uniform sampler2D blur4Texture;
uniform sampler2D blur5Texture;
uniform sampler2D discTexture;
uniform vec2 resolution;
uniform float vignetteBoost;
uniform float vignetteReduction;

varying vec2 vUv;

${screen}
${vignette}
${fxaa}
${softLight}

void main() {
  vec4 b = texture2D(backTexture, vUv);
  vec4 g = texture2D(glowTexture, vUv);
  vec4 d = fxaa(discTexture, vUv);

  vec4 bloom = vec4(0.);
  bloom += 1. * texture2D( blur1Texture, vUv );
  bloom += 1.2 * texture2D( blur2Texture, vUv );
  bloom += 1.4 * texture2D( blur3Texture, vUv );
  bloom += 1.6 * texture2D( blur4Texture, vUv );
  bloom += 1.8 * texture2D( blur5Texture, vUv );

  vec3 c1 = vec3(0.9,0.33,0.1);
  vec3 c2 = vec3(1.0,0.8,0.7);
  vec3 dcol = mix(c2,c1,d.r);

  vec4 c = vec4(dcol, 1.) * d.g ;
  vec4 color = clamp((b*(1.-d.a)+c) +1.* g + 1.*.5*bloom.r,vec4(0.), vec4(1.));
  vec4 finalColor =  softLight(color, vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.));

  gl_FragColor = screen(finalColor,finalColor,1.);
}`;

export { fs };