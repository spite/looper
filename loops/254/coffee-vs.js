const vs = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;

varying vec3 e;
varying vec3 n;
varying vec3 vRefract;
varying vec3 vReflect;
varying float rim;
varying float vDepth;

void main() {
  e = normalize( vec3( modelViewMatrix * vec4( position, 1.0 ) ) );
  n = normalize( normalMatrix * normal );
  rim = pow(abs(dot(e,n)),2.);
  vec4 mPosition = modelMatrix * vec4( position, 1.0 );
  vec3 nWorld = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
  vRefract = normalize( refract( normalize( mPosition.xyz - cameraPosition ), nWorld, .5 ) );
  vReflect = normalize( reflect( normalize( mPosition.xyz - cameraPosition ), nWorld) );
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

  float l = .5*length(cameraPosition);
  vDepth = clamp(1.-(-mvPosition.z-l) / l,0.,1.);

  gl_Position = projectionMatrix * mvPosition;
}
`;

export { vs };