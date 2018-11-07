const fs = `
precision highp float;

uniform float showNormals;

varying vec4 vColor;

void main() {
  if(showNormals == 1.) {
    gl_FragColor = vColor;
  } else {
    gl_FragColor = vec4(.5 + vColor.rgb, 1.);
}
}`;

export { fs };