import screen from '../../shaders/screen.js';
import softLight from '../../shaders/soft-light.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform sampler2D screenTexture;
uniform sampler2D blur1Texture;
uniform sampler2D blur2Texture;
uniform sampler2D blur3Texture;
uniform sampler2D blur4Texture;
uniform sampler2D blur5Texture;
uniform sampler2D discTexture;

varying vec2 vUv;

${screen}
${softLight}

void main() {
  vec4 color = texture2D(inputTexture, vUv);
  vec4 scene = texture2D(screenTexture, vUv);
  vec4 bloom = vec4(0.);
  bloom += 1. * texture2D( blur1Texture, vUv );
  bloom += 1.2 * texture2D( blur2Texture, vUv );
  bloom += 1.4 * texture2D( blur3Texture, vUv );
  bloom += 1.6 * texture2D( blur4Texture, vUv );
  bloom += 1.8 * texture2D( blur5Texture, vUv );

  vec4 finalColor = screen(.5*color+.1*scene.a,scene,1.);
  finalColor = finalColor + .25*bloom;
  gl_FragColor = finalColor;
}
`;

export { fs };