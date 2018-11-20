const fs = `
precision highp float;

uniform sampler2D noiseTexture;
uniform float repeat;
uniform float time;
uniform float opacity;

varying vec2 vUv;
varying float d;

void main() {
  vec4 c = texture2D(noiseTexture, vUv * vec2(1.,repeat) + vec2(time,0.));
  vec4 c2 = texture2D(noiseTexture, vUv * vec2(1.,2.*repeat) + vec2(3.*time,0.));
  vec4 c3 = texture2D(noiseTexture, vUv * vec2(1.,.5*repeat) + vec2(2.*time,0.));
  gl_FragColor = vec4(d+c.rgb, c.r*d);
  gl_FragColor.g = c2.g;
  gl_FragColor.b = c3.r;
  gl_FragColor.rgb *= opacity;
}`;

export { fs };