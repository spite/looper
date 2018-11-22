import grayscale from '../../shaders/grayscale.js';

const fs = `
precision highp float;

uniform sampler2D shadeTexture;
uniform sampler2D liquidTexture;

varying vec2 vUv;

${grayscale}

void main() {
  vec4 s = texture2D(shadeTexture, vUv);
  vec4 l = texture2D(liquidTexture, vUv);
  gl_FragColor = clamp((s*l) - vec4(.75), vec4(0.), vec4(1.))*3.;
  gl_FragColor.rgb = vec3(grayscale(gl_FragColor));
}`;

export { fs };