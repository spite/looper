const vs = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

uniform float frequency;
uniform float time;

varying vec3 vNormal;
varying vec2 vUv;

float calcOffset(vec2 p, float amplitude) {
  return amplitude + amplitude *sin(20.*length(p.xy)-frequency*time);
}

void main() {
  vec4 p = vec4( position, 1. );
  vUv = uv;
  float e = .0001;
  float amplitude = .1 / ( 1.+.1*length(p.xy));
  float offset = calcOffset(position.xy,amplitude);
  float offset1 = calcOffset(position.xy+vec2(e,0.), amplitude);
  float offset2 = calcOffset(position.xy+vec2(0.,e), amplitude);
  vec3 n = vec3(offset-offset1, offset-offset2, e);
  vNormal = normalize(n);
  p.z += offset;
  gl_Position = projectionMatrix * modelViewMatrix * p;
}`;

export { vs };