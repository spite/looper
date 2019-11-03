import grayscale from '../../../shaders/grayscale.js';

const fs =
  `
precision highp float;

uniform sampler2D shadeTexture;
uniform sampler2D colorTexture;

varying vec2 vUv;

${grayscale}

void main() {
  vec4 l = texture2D(colorTexture, vUv);
  float a = 1.*clamp(l.a+.25,0.,1.);//smoothstep(l.a,.4,.6);
  gl_FragColor.rgb = vec3(1.-a);//vec3(grayscale(gl_FragColor));
}`;

export { fs };