const fs = `
precision highp float;

uniform float isParticle;

varying float vDepth;
varying float vColor;

void main() {
  float d = 2.*clamp(length(.5-gl_PointCoord.xy),0.,1.);
  if(d>1.) {
    discard;
  }
  d = 1.-smoothstep(.5-.5*vDepth,.5+.5*vDepth, d);
  gl_FragColor = vec4(.1,.01*vDepth,0., 1.);
}`;

export { fs };