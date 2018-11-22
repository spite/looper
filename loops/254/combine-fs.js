import screen from '../../shaders/screen.js';

const fs = `
precision highp float;

uniform sampler2D liquidTexture;
uniform sampler2D blur1Texture;
uniform sampler2D blur2Texture;
uniform sampler2D blur3Texture;
uniform sampler2D blur4Texture;
uniform sampler2D blur5Texture;
uniform sampler2D shadeTexture;

varying vec2 vUv;

${screen}

void main() {
  vec4 g = texture2D(liquidTexture, vUv);
  vec4 d = texture2D(shadeTexture, vUv);

  vec4 bloom = vec4(0.);
  bloom += 1. * texture2D( blur1Texture, vUv );
  bloom += 1.2 * texture2D( blur2Texture, vUv );
  bloom += 1.4 * texture2D( blur3Texture, vUv );
  bloom += 1.6 * texture2D( blur4Texture, vUv );
  bloom += 1.8 * texture2D( blur5Texture, vUv );

  vec4 c = (g*d)+.5*bloom;
  c = screen(c,c,.5);
  c = screen(c,vec4(200.,77.,0.,1.)/255.,.25);
  gl_FragColor = mix(c,vec4(.5),1.-g.a);
}`;

export { fs };