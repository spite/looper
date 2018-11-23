import grayscale from '../../shaders/grayscale.js';

const fs = `
precision highp float;

uniform sampler2D inputTexture;

varying vec2 vUv;

${grayscale}

void main() {
  vec4 c = texture2D(inputTexture, vUv);
  c = clamp(c - vec4(.5), vec4(0.), vec4(1.))*1.;
  float g = grayscale(c);
  g = smoothstep(.3,.6,g);
  gl_FragColor.rgb = vec3(g);
}`;

export { fs };