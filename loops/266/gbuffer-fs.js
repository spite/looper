const fs = `
precision highp float;

uniform sampler2D gradient;

varying vec2 vUv;
varying vec3 vNormal;
varying float vDepth;
varying float vDepthCenter;

void main(){
  gl_FragColor = vec4( .5 + .5 * vNormal, vDepth);
}`;

export { fs };
