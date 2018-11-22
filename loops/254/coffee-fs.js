const fs = `
precision highp float;

uniform sampler2D envTexture;

varying float rim;
varying vec3 e;
varying vec3 n;
varying vec3 vRefract;
varying vec3 vReflect;
varying float vDepth;

#define PI 3.1415926535897932384626433832795

void main() {
  vec3 baseColor = vec3(27.,14.,2.)/255.;
  float yaw = .5 - atan( vReflect.z, - vReflect.x ) / ( 2.0 * PI );
  float pitch = .5 - asin( vReflect.y ) / PI;
  vec3 envColor = texture2D( envTexture, vec2( 1.-yaw, 1.-pitch ) ).rgb;

  yaw = .5 - atan( vRefract.z, - vRefract.x ) / ( 2.0 * PI );
  pitch = .5 - asin( vRefract.y ) / PI;
  vec3 refColor = texture2D( envTexture, vec2( 1.-yaw, 1.-pitch ) ).rgb;

  vec3 env = pow(rim,2.) * smoothstep(vec3(.9),vec3(1.),envColor);
  vec3 ref = pow(1.-rim,2.) * smoothstep(vec3(.9),vec3(1.),refColor);
  vec3 color = baseColor + .3*vDepth * baseColor + pow(rim,1.)*baseColor + pow(1.-rim,3.) * vec3(.1,0.,0.) + env  + ref;
  color *= .75 + .25*vDepth;
  color += clamp(smoothstep(vec3(.45),vec3(.55),envColor * pow(rim,20.)), vec3(0.), vec3(1.));
  color += .125*vDepth;

  gl_FragColor = vec4(color, 1.);
}`;

export { fs };