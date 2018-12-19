import THREE from '../third_party/three.js';

import { getFBO } from './fbo.js';
import ShaderPass from '../modules/shader-pass.js';
import ShaderPingPongPass from '../modules/shader-ping-pong-pass.js';

import orthoVertexShader from '../shaders/ortho.js';
import vignette from '../shaders/vignette.js';
import fxaa from '../shaders/fxaa.js';
import rgbShift from '../shaders/rgb-shift.js';
import { gammaCorrect, levelRange, finalLevels } from '../shaders/levels.js';
import { blur5 } from '../shaders/fast-separable-gaussian-blur.js';
import screen from '../shaders/screen.js';

const antialiasFragmentShader = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform sampler2D blur1Texture;
uniform sampler2D blur2Texture;
uniform sampler2D blur3Texture;
uniform sampler2D blur4Texture;
uniform sampler2D blur5Texture;

uniform float minLevel;
uniform float maxLevel;
uniform float gamma;

varying vec2 vUv;
${fxaa}
${gammaCorrect}
${levelRange}
${finalLevels}
${screen}

void main() {
  vec4 color = fxaa(inputTexture, vUv );
  vec4 bloom = vec4(0.);
  bloom += 1. * texture2D( blur1Texture, vUv );
  bloom += 1.2 * texture2D( blur2Texture, vUv );
  bloom += 1.4 * texture2D( blur3Texture, vUv );
  bloom += 1.6 * texture2D( blur4Texture, vUv );
  bloom += 1.8 * texture2D( blur5Texture, vUv );

  color= screen(color,bloom,.5);
  color.rgb = finalLevels(color.rgb, vec3(minLevel), vec3(gamma), vec3(maxLevel));
  gl_FragColor = color;
}
`;

const rgbFragmentShader = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;

varying vec2 vUv;
${rgbShift}

void main() {
  gl_FragColor = rgbShift(inputTexture, vUv,resolution/40.);
}
`;

const blurFragmentShader = `
precision highp float;

uniform vec2 resolution;
uniform sampler2D inputTexture;
uniform vec2 direction;

varying vec2 vUv;

${blur5}

void main() {
  gl_FragColor = blur5(inputTexture, vUv, resolution, direction);
}`;

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);

  const blurPasses = [];
  const levels = 5;
  const blurShader = new THREE.RawShaderMaterial({
    uniforms: {
      inputTexture: { value: null },
      resolution: { value: new THREE.Vector2(w, h) },
      direction: { value: new THREE.Vector2(0, 1) }
    },
    vertexShader: orthoVertexShader,
    fragmentShader: blurFragmentShader,
  });
  let tw = w;
  let th = h;
  for (let i = 0; i < levels; i++) {
    tw /= 2;
    th /= 2;
    tw = Math.round(tw);
    th = Math.round(th);
    const blurPass = new ShaderPingPongPass(renderer, blurShader, tw, th, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);
    blurPasses.push(blurPass);
  }

  const antialiasShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: colorFBO.texture },
      blur1Texture: { value: blurPasses[0].fbo.texture },
      blur2Texture: { value: blurPasses[1].fbo.texture },
      blur3Texture: { value: blurPasses[2].fbo.texture },
      blur4Texture: { value: blurPasses[3].fbo.texture },
      blur5Texture: { value: blurPasses[4].fbo.texture },
      minLevel: { value: params.minLevel || 0 },
      maxLevel: { value: params.maxLevel || .8 },
      gamma: { value: params.gamma || 1.4 }
    },
    vertexShader: orthoVertexShader,
    fragmentShader: antialiasFragmentShader,
  });
  const antialiasPass = new ShaderPass(renderer, antialiasShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const rgbShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: antialiasPass.fbo.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: rgbFragmentShader,
  });
  const rgbPass = new ShaderPass(renderer, rgbShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera) {
    renderer.render(scene, camera, colorFBO);

    let offset = 1;
    let tw = w;
    let th = h;
    blurShader.uniforms.inputTexture.value = colorFBO;
    for (let j = 0; j < levels; j++) {
      tw /= 2;
      th /= 2;
      tw = Math.round(tw);
      th = Math.round(th);
      blurShader.uniforms.resolution.value.set(tw, th);
      blurShader.uniforms.direction.value.set(offset, 0);
      const blurPass = blurPasses[j];
      blurPass.render();
      blurShader.uniforms.inputTexture.value = blurPass.fbos[blurPass.currentFBO];
      blurShader.uniforms.direction.value.set(0, offset);
      blurPass.render();
      blurShader.uniforms.inputTexture.value = blurPass.fbos[blurPass.currentFBO];
    }

    antialiasPass.render();
    rgbPass.render(true);
  }

  return {
    render
  }
}

export { Post };