import screen from '../../shaders/screen.js';

const fs = `
precision highp float;

uniform sampler2D jewelTexture;
uniform sampler2D depthTexture;

varying vec2 vUv;

${screen}

void main() {
  vec4 c = texture2D(jewelTexture, vUv);
  vec4 d = texture2D(depthTexture, vUv);
  vec4 tint = vec4(132.,204.,93.,255.)/255.;
  vec4 tint2 = vec4(152.,224.,63.,255.)/255.;
  vec4 color = c * tint;
  color *= (.5+.5* d.r);
  gl_FragColor = screen(color, tint2 *vec4(pow(d.g,6.))*d.a, 1.);
}`;

export { fs };