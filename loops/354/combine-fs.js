import screen from '../../shaders/screen.js';

const fs =
  `
precision highp float;

uniform sampler2D colorTexture;
uniform sampler2D blur1Texture;
uniform sampler2D blur2Texture;
uniform sampler2D blur3Texture;
uniform sampler2D blur4Texture;
uniform sampler2D blur5Texture;
uniform sampler2D shadeTexture;

varying vec2 vUv;

${screen}

void main() {
  vec4 g = texture2D(colorTexture, vUv);

  vec4 bloom = vec4(0.);
  bloom += 1. * texture2D( blur1Texture, vUv );
  bloom += 1. * texture2D( blur2Texture, vUv );
  bloom += 1. * texture2D( blur3Texture, vUv );
  bloom += 1. * texture2D( blur4Texture, vUv );
  bloom += 1. * texture2D( blur5Texture, vUv );

  gl_FragColor = screen(g+bloom,bloom,.1);
}`;

export { fs };