import screen from '../../shaders/screen.js';

const fs = `
#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform sampler2D envMap;
uniform sampler2D normalMap;
uniform sampler2D stickTexture;

uniform mat4 modelViewMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform vec2 resolution;

uniform vec3 brightColor;
uniform vec3 darkColor;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying float vDepth;

#define PI 3.1415926535897932384626433832795

vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm ) {
  // Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988
  vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );
  vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );
  vec2 st0 = dFdx( vUv.st );
  vec2 st1 = dFdy( vUv.st );
  float scale = sign( st1.t * st0.s - st0.t * st1.s ); // we do not care about the magnitude
  vec3 S = normalize( ( q0 * st1.t - q1 * st0.t ) * scale );
  vec3 T = normalize( ( - q0 * st1.s + q1 * st0.s ) * scale );
  vec3 N = normalize( surf_norm );
  mat3 tsn = mat3( S, T, N );
  vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
  //mapN.xy *= normalScale;
  mapN.xy *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );
  return normalize( tsn * mapN );
}

vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
  return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}

${screen}

void main() {
  vec4 stick = 1.-texture2D(stickTexture, gl_FragCoord.xy/resolution);

  vec3 baseColor = vec3(127.,0.,0.)/255.;
  baseColor *= (.5+.5*gl_FragCoord.y/resolution.y);

  vec3 rimColor = vec3(255.,175.,25.)/255.;
  vec3 brushNormal = texture2D(normalMap, vUv).xyz * 2. -1.;

  vec3 pNormal = perturbNormal2Arb(-vViewPosition, vNormal);
  vec3 n = normalize( normalMatrix * pNormal );

  vec4 mPosition = modelMatrix * vec4( vPosition, 1.0 );
  vec3 worldNormal = inverseTransformDirection( n, viewMatrix );
  vec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );
  //vec3 vRefract = normalize( refract( cameraToVertex, worldNormal, .8 ) );
  vec3 vReflect = normalize( reflect( cameraToVertex, worldNormal) );
  vec3 vReflect2 = normalize( reflect( cameraToVertex, inverseTransformDirection( normalize(normalMatrix*vNormal), viewMatrix )));

  vec3 e = normalize( vViewPosition );
  float rim = pow(abs(dot(e,n)),2.);

  vec2 luv;
  luv.x = atan( vReflect.z, vReflect.x );
  luv.y = acos( vReflect.y );
  luv /= vec2( 2. * PI, PI );
  vec3 envColor = texture2D( envMap, luv).rgb;

  luv.x = atan( vReflect2.z, vReflect2.x );
  luv.y = acos( vReflect2.y );
  luv /= vec2( 2. * PI, PI );
  vec3 refColor = texture2D( envMap, luv).rgb;

  vec3 color = baseColor + .5*pow(rim,2.) + .1*pow(1.-rim,2.);
  vec3 light = .5*smoothstep(vec3(.9),vec3(1.),refColor) + .5*smoothstep(vec3(.9),vec3(1.),envColor);
  color += 1.*light * 2.*pow((1.-rim),.8);
  color *= .8 + .2 * ( 1. - ((1.-stick.rgb) * (1.-rim)));
  color = screen(vec4(color,1.),vec4(rimColor,1.) * pow(1.-rim,2.),.5).xyz;
  gl_FragColor = vec4(color, 1.);
}
`;

export { fs };