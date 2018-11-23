const fs = `
precision highp float;

uniform sampler2D gradientTexture;
uniform float time;

varying vec2 vUv;
varying vec3 vWorldPos;
varying float vDisplacement;
varying float vDepth;

void main() {
  float y = clamp(.4+.05*vDisplacement, 0.,1.);
  vec4 c = texture2D(gradientTexture, vec2(.5,y));
  c *= smoothstep(.13,.6,y);
  float a = smoothstep(.45,.55,.4+.05*vDisplacement);
  gl_FragColor = vec4(c.rgb+.25*vDepth,1.);
}`;

export { fs };