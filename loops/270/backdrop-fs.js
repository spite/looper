import screen from '../../shaders/screen.js';

const fs = `
precision highp float;

uniform sampler2D gradient;

varying vec3 vPosition;
varying float vDepth;
varying float vDepthCenter;

${screen}

void main(){
  vec3 lightColor = vec3(00.)/255.;
  vec3 topColor = vec3(0.,0.,64.)/255.;
  vec3 bottomColor = vec3(255.,0.,255.)/255.;
  vec3 color = mix(bottomColor,topColor,.5*vPosition.y);
  gl_FragColor = vec4( color, 1. );
}`;

export { fs };