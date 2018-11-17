const fs = `
precision highp float;

varying vec3 vPosition;

void main() {
  float y = smoothstep(.45,.55,.5 + .5 * sin(.75*vPosition.y));
  gl_FragColor = vec4(y,y,y,1.);
}`;

export { fs };