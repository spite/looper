const fs = `
precision highp float;

uniform vec3 brightColor;
uniform vec3 darkColor;

varying vec2 vUv;

void main() {
  float c = smoothstep(.45, .55, .5 + .5 * sin(vUv.y * 100.));
  gl_FragColor = vec4(mix(brightColor/255., darkColor/255., c),1.);
}
`;

export { fs };