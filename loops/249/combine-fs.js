const fs = `
precision highp float;

uniform sampler2D colorTexture;
uniform sampler2D blur1Texture;
uniform sampler2D blur2Texture;

varying vec2 vUv;

void main() {
  vec4 c = texture2D(colorTexture, vUv);
  vec4 b1 = texture2D(blur1Texture, vUv);
  vec4 b2 = texture2D(blur2Texture, vUv);
  gl_FragColor = mix(b1,c+.5*b2,c.a);
}`;

export { fs };