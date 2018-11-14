const fs = `
precision highp float;

uniform sampler2D noiseTexture;
uniform float level;

varying vec4 vColor;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vec4 c = texture2D(noiseTexture, vUv);
  float f = c.r;
  if(f>level) {
    gl_FragColor = vec4(f,length(vPosition),c.g,f-level);
  } else {
    discard;
  }
}`;

export { fs };