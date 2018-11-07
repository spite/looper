import noise3d from '../../shaders/noise3d.js';

const fs = `
precision highp float;

uniform sampler2D backTexture;
uniform sampler2D frontTexture;
uniform sampler2D normalsTexture;
uniform sampler2D colorTexture;

uniform float time;

varying vec2 vUv;

${noise3d}

float map( in vec3 p ){
  vec3 q = p;//p - vec3(0.0,0.1,1.0)*iTime;
  float f;
    f  = 0.50000*noise3d( q );
    q = q*2.02;
    f += 0.25000*noise3d( q );
  return f;
}

#define MAX 200

void main() {
  vec3 lightColor = vec3(41.,86.,80.)/255.;
  vec3 darkColor = vec3(32.,37.,42.)/255.;

  vec4 normal = texture2D(normalsTexture, vUv);
  vec4 back = texture2D(backTexture,vUv);
  vec4 front = texture2D(frontTexture,vUv);
  vec3 dir = back.xyz-front.xyz;
  float ld = length(dir);
  dir = refract(dir,normalize(normal.xyz), .8);
  float d = length(dir);
  dir = normalize(dir);
  float fSteps = 40. * d;
  int steps = int(fSteps);
  vec3 fStep = dir / fSteps;
  float n = 0.;
  vec3 p = back.xyz;
  for(int i=0; i<MAX; i++){
    if(i>steps || n>1.) {
      break;
    }
    p = front.xyz + float(i) * fStep;
    float v = clamp(map(1.5*p),0.,1.);
    n += v/fSteps;
  }
  n *= 5.;
  vec3 color = texture2D(colorTexture, vUv).xyz;
  float mask = clamp(ld,0.,1.);
  gl_FragColor.rgb = mix(darkColor,lightColor*n,mask);
  gl_FragColor.rgb += color * back.a;
  float rim = smoothstep(.5,1.,(1.-ld));
  gl_FragColor.rgb += lightColor *rim * back.a;
  gl_FragColor.rgb = mix(vec3(.3), gl_FragColor.rgb, back.a);
  gl_FragColor.a = 1.;
}`;

export { fs };