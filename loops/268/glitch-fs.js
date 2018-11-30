import { glitch } from '../../shaders/glitch.js';

const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform float time;

varying vec2 vUv;

${glitch}

void main() {
  vec4 color = glitch(inputTexture, vUv,  .6, time);
  color.rgb *= .75 + .25 * sin( 1.5 * resolution.y * vUv.y );
  gl_FragColor = color;
}
`;

export { fs };