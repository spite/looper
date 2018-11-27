const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform sampler2D backTexture;
uniform sampler2D shadowsTexture;

varying vec2 vUv;

void main() {
  vec4 b = texture2D(backTexture, vUv);
  vec4 c = texture2D(inputTexture, vUv);
  vec4 s = texture2D(shadowsTexture, vUv);
  vec4 color = b * (.5+.5*vec4(length(s.rg))*(1.-c.a)*vUv.y);
  color = color + .5*vec4(c.r);
  if(c.g>0.) color = mix(b,color,.5 + .5 *c.g);
  gl_FragColor = color;
}
`;

export { fs };