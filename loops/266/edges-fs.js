import sobel from '../../shaders/sobel.js';
import grayscale from '../../shaders/grayscale.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;

varying vec2 vUv;
${sobel}
${grayscale}

void main() {
  float a = texture2D(inputTexture,vUv).a;
  vec4 color = vec4(sobel(inputTexture, vUv),1.);
  gl_FragColor = vec4(vec3(grayscale(color.rgb)), a);
}
`;

export { fs };