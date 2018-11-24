const fs = `
precision highp float;

varying float vDepth;
varying float vDepthCenter;

void main(){
  gl_FragColor = vec4( vDepth, vDepthCenter, 0., 1. );
}`;

export { fs };