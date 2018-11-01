import THREE from '../third_party/three.js';

import orthoVertexShader from '../shaders/ortho.js';
import vignette from '../shaders/vignette.js';
import fxaa from '../shaders/fxaa.js';
import softLight from '../shaders/soft-light.js';
import ShaderPass from '../modules/shader-pass.js';

const fragmentShader = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform float vignetteBoost;
uniform float vignetteReduction;

varying vec2 vUv;
${vignette}
${fxaa}
${softLight}

void main() {
  vec4 color = fxaa(inputTexture, vUv);
  gl_FragColor = softLight(color, vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.));
}
`;


function Default(renderer, params = {}) {

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

  const shader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: params.vignetteBoost || .5 },
      vignetteReduction: { value: params.vignetteReduction || .5 },
      inputTexture: { value: colorFBO.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: fragmentShader,
  });
  const pass = new ShaderPass(renderer, shader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera) {
    renderer.render(scene, camera, colorFBO);
    pass.shader.uniforms.inputTexture.value = colorFBO.texture;
    pass.render(true);
  }

  return {
    render
  }
}

export default Default;