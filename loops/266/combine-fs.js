const fs = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform sampler2D edgesTexture;

varying vec2 vUv;

void main() {
  vec4 color = texture2D(inputTexture, vUv);
  vec4 edges = texture2D(edgesTexture, vUv);
  gl_FragColor = color * (.5+.5*edges);
}
`;

export { fs };