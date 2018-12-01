import screen from '../../shaders/screen.js';

const fs = `
precision highp float;

uniform sampler2D inputTexture;

varying vec2 vUv;
varying float vDepth;
varying float vDepthCenter;

${screen}

void main(){
  vec4 color = texture2D(inputTexture,vUv);
  color.rgb *= .75 + .25 * sin( 1.5 * 300. * vUv.y );
  gl_FragColor = vec4( color.rgb, vDepth );
}`;

export { fs };