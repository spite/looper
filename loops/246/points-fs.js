const fs = `
precision highp float;

uniform sampler2D texture;
uniform float isParticle;

varying float vDepth;
varying float vColor;

void main() {
  float d = 2.*clamp(length(.5-gl_PointCoord.xy),0.,1.);
  if(d>1.) {
    discard;
  }
    d = 1.-smoothstep(.5-.5*vDepth,.5+.5*vDepth, d);
  if(isParticle==1.){
    gl_FragColor.rgb = vec3(vColor + .2);
  } else {
    gl_FragColor.rgb = vec3(vColor);
  }
  gl_FragColor.a = d;
}`;

export { fs };