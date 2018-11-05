import THREE from '../third_party/three.js';

import orthoVertexShader from '../shaders/ortho.js';
import vignette from '../shaders/vignette.js';
import fxaa from '../shaders/fxaa.js';
import grayscale from '../shaders/grayscale.js';
import sobel from '../shaders/sobel.js';
import overlay from '../shaders/overlay.js';
import softLight from '../shaders/soft-light.js';
import lighten from '../shaders/lighten.js';
import { levelRange } from '../shaders/levels.js';
import { blur5 } from '../shaders/fast-separable-gaussian-blur.js';
import highPass from '../shaders/high-pass.js';
import ShaderPass from '../modules/shader-pass.js';

const antialiasFragmentShader = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform float minLevel;
uniform float maxLevel;

varying vec2 vUv;
${fxaa}
${levelRange}

void main() {
  gl_FragColor = vec4(levelRange(fxaa(inputTexture, vUv ).rgb, vec3(minLevel), vec3(maxLevel)),1.);
}
`;

const grayscaleFragmentShader = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform vec2 direction;

varying vec2 vUv;
${grayscale}
${blur5}

void main() {
  vec4 color = blur5(inputTexture, vUv, resolution, direction);
  gl_FragColor = vec4(vec3(grayscale(color)),1.);
}
`;

const edgesFragmentShader = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;

varying vec2 vUv;
${sobel}

void main() {
  gl_FragColor = vec4(sobel(inputTexture, vUv),1.);
}
`;

const fragmentShader = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform sampler2D edgesTexture;
uniform sampler2D grayscaleTexture;
uniform float vignetteBoost;
uniform float vignetteReduction;

varying vec2 vUv;
${vignette}
${fxaa}
${sobel}
${overlay}
${softLight}
${lighten}
${highPass}

void main() {
  vec4 color = texture2D(inputTexture, vUv);
  vec4 edges = texture2D(edgesTexture, vUv);
  vec4 grayEdges = 1.-texture2D(grayscaleTexture, vUv);

  color = overlay(color, edges, .4);

  vec4 hp = highPass(inputTexture, vUv);
  color = softLight(color, hp);
  color = lighten(color, grayEdges);

  color = softLight(color, vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.));

  gl_FragColor = color;
}
`;


function Painted(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = new THREE.WebGLRenderTarget(w, h, {
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    minFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
    depthBuffer: true
  });

  const antialiasShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: colorFBO.texture },
      minLevel: { value: 0 },
      maxLevel: { value: 1 }
    },
    vertexShader: orthoVertexShader,
    fragmentShader: antialiasFragmentShader,
  });
  const antialiasPass = new ShaderPass(renderer, antialiasShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const edgesShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: colorFBO.texture }
    },
    vertexShader: orthoVertexShader,
    fragmentShader: edgesFragmentShader,
  });
  const edgesPass = new ShaderPass(renderer, edgesShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const blurShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      direction: { value: new THREE.Vector2(1, 0) },
      inputTexture: { value: edgesPass.fbo.texture }
    },
    vertexShader: orthoVertexShader,
    fragmentShader: grayscaleFragmentShader,
  });
  const blurHPass = new ShaderPass(renderer, blurShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);
  const blurVPass = new ShaderPass(renderer, blurShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const shader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: .5 },
      vignetteReduction: { value: .5 },
      inputTexture: { value: antialiasPass.fbo.texture },
      edgesTexture: { value: edgesPass.fbo.texture },
      grayscaleTexture: { value: blurVPass.fbo.texture }
    },
    vertexShader: orthoVertexShader,
    fragmentShader: fragmentShader,
  });
  const pass = new ShaderPass(renderer, shader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera) {
    renderer.render(scene, camera, colorFBO);
    antialiasPass.shader.uniforms.inputTexture.value = colorFBO.texture;
    antialiasPass.shader.uniforms.minLevel.value = params.minLevel || .2;
    antialiasPass.render();
    edgesPass.render();
    blurHPass.shader.uniforms.inputTexture.value = edgesPass.fbo.texture;
    blurHPass.shader.uniforms.direction.value.set(2, 0);
    blurHPass.render();
    blurVPass.shader.uniforms.inputTexture.value = blurHPass.fbo.texture;
    blurVPass.shader.uniforms.direction.value.set(0, 2);
    blurVPass.render();
    blurHPass.shader.uniforms.inputTexture.value = blurVPass.fbo.texture;
    blurHPass.shader.uniforms.direction.value.set(2, 0);
    blurHPass.render();
    blurVPass.shader.uniforms.inputTexture.value = blurHPass.fbo.texture;
    blurVPass.shader.uniforms.direction.value.set(0, 2);
    blurVPass.render();
    pass.render();
    antialiasPass.shader.uniforms.minLevel.value = 0;
    antialiasPass.shader.uniforms.inputTexture.value = pass.fbo.texture;
    antialiasPass.render(true);
  }

  return {
    render
  }
}

export default Painted;