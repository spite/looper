import screen from '../../shaders/screen.js';

const fs = `
precision highp float;

uniform sampler2D gradient;

varying vec3 vPosition;
varying float vDepth;
varying float vDepthCenter;

${screen}

void main(){
  vec3 topColor = vec3(255.,128.,128.)/255.;
  vec3 bottomColor = vec3(255.,64.,64.)/255.;
  vec3 color = mix(bottomColor,topColor,.5+vPosition.y);
  color = screen(vec4(color,1.), vec4(vec3(1.-vDepthCenter),1.),.5).rgb;
  color *= .75+vPosition.y;
  gl_FragColor = vec4( color, 1. );
}`;

export { fs };