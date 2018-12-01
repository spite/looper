const fs = `
precision highp float;

uniform sampler2D gradient;

varying vec2 vUv;
varying float vDepth;
varying float vDepthCenter;

void main(){
  float center = 1.-abs(vUv.x);
  gl_FragColor = vec4( center, vDepth, vDepthCenter, 1. );
}`;

export { fs };