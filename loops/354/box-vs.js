import { map1 } from '../../shaders/map.js';

const vs =
  `
precision highp float;

attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

attribute vec3 instancePosition;
attribute vec4 instanceQuaternion;
attribute vec3 instanceScale;
attribute vec4 instanceColor;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;
uniform mat3 normalMatrix;

uniform float d;

varying vec3 vColor;
varying vec2 vN;
varying float vDepth;

${map1}

vec3 applyTRS( vec3 position, vec3 translation, vec4 quaternion, vec3 scale ) {
  position *= scale;
  position += 2.0 * cross( quaternion.xyz, cross( quaternion.xyz, position ) + quaternion.w * position );
  return position + translation;
}

void main() {
  vColor = instanceColor.rgb;
  vec3 transformed = applyTRS(position, instancePosition, instanceQuaternion, instanceScale);
  vDepth = map(transformed.z,-d,-.5*d,0.,1.);
  vec3 transformedNormal = normalMatrix * applyTRS(normal, vec3(0.), instanceQuaternion, vec3(1.));
  vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
  gl_Position = projectionMatrix * mvPosition;

  vec3 e = normalize( mvPosition.xyz);
  vec3 n = normalize( normalMatrix * transformedNormal );
  vec3 r = reflect( e, n );
  float m = 2.82842712474619 * sqrt( r.z+1.0 );
  vN = r.xy / m + .5;
}
`;

export { vs };