const fs = `
precision highp float;

#define M_PI 3.1415926535897932384626433832795

varying float vDir;
varying vec4 worldPos;
varying vec3 vNormal;

uniform float level;
uniform vec3 color;
uniform vec3 topColor;
uniform float time;

void main() {
  float speed = 1.;
  float amplitude = .2;
  float y = worldPos.y - amplitude*time*sin(speed*worldPos.x+time*2.*M_PI) - amplitude*time*sin(speed*1.1*worldPos.z+time*2.*M_PI);;
  if(y>level) {
    discard;
  }
  if(vDir<0.) {
    gl_FragColor = vec4(topColor/255.,1.)+.1;
  } else {
    float h = clamp(length(y-level),0.,1.);
    h = 1.-smoothstep(0.,.1,h);
    gl_FragColor = vec4(color/255.,1.) + .1*max(1.-vDir, h);
  }
}
`;

export { fs };