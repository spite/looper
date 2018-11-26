const fs = `
precision highp float;

uniform sampler2D gradient;

varying vec2 vUv;
varying float vDepth;
varying float vDepthCenter;

void main(){
  float repeat = 10.;
  vec3 c1 = texture2D(gradient, vec2(vUv.x*repeat,0.)).rgb;
  vec3 c2 = texture2D(gradient, vec2(vUv.y*repeat,0.)).rgb;
  float f = length(vUv.x+.25);
  f = smoothstep(.2,.25,f);
  vec3 c = mix(c1, c2, 1.-f);
  gl_FragColor = vec4( c * 2.*(.5+1.-vDepth), 1. );
}`;

export { fs };