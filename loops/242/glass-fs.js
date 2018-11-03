const fs = `
precision highp float;

#define M_PI 3.1415926535897932384626433832795

uniform sampler2D backTexture;
varying vec2 vUv;
varying vec2 vUvReflect;
varying vec2 vUvRefract;
varying float vDot;

void main() {
  vec2 uv = gl_FragCoord.xy/800.;
  vec4 reflections = mix(texture2D(backTexture, uv+ vUvRefract), texture2D(backTexture, uv+ vUvReflect), vDot);
  gl_FragColor = mix(texture2D(backTexture,uv ), reflections, .5 + .5*vDot);
}
`;

export { fs };