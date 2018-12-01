const fs = `
precision highp float;

uniform sampler2D gradient;

varying vec2 vUv;
varying float vDepth;
varying float vDepthCenter;
varying vec3 vPosition;

#define M_PI 3.1415926535897932384626433832795
#define M_TAU (2.*M_PI)
#define LINES 100.

void main(){
  float f = .999 - .1*pow(vUv.y,.25);
  float deg = .2+smoothstep(0.,.05,vUv.y);
  vec3 topColor = vec3(255.,0.,255.)/255.;
  vec3 bottomColor = vec3(0.,255.,255.)/255.;
  float grid = max(smoothstep(f,1.,clamp(cos(LINES * M_TAU*vUv.x),0.,1.)),smoothstep(f,1.,clamp(cos(2.*LINES * M_TAU*vUv.y),0.,1.)));
  vec3 gridColor = mix(bottomColor,topColor,pow(vPosition.y,.25)) * grid * deg;
  vec3 planeColor = mix(bottomColor,topColor,pow(vPosition.y,.25)) * deg;
  gl_FragColor = vec4( mix(planeColor, gridColor,.7), 1. );
}`;

export { fs };