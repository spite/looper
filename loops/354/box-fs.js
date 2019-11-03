import screen from '../../shaders/screen.js';

const fs =
  `
precision highp float;

uniform sampler2D matCap;

varying vec3 vColor;
varying vec2 vN;
varying float vDepth;

${screen}

void main(){
  vec4 b = texture2D(matCap,vN);
  vec3 c = vDepth*vColor+b.rgb*vDepth;
  gl_FragColor = vec4(c,1.-b.r*vDepth);
}`;

export { fs };