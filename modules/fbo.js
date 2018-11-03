import THREE from '../third_party/three.js';

function getFBO(w, h, options = {}) {
  const fbo = new THREE.WebGLRenderTarget(w, h, {
    wrapS: options.wrapS || THREE.ClampToEdgeWrapping,
    wrapT: options.wrapT || THREE.ClampToEdgeWrapping,
    minFilter: options.minFilter || THREE.LinearFilter,
    magFilter: options.magFilter || THREE.LinearFilter,
    format: options.format || THREE.RGBAFormat,
    stencilBuffer: options.stencilBuffer || false,
    depthBuffer: options.depthBuffer || true
  });
  return fbo;
}

export { getFBO }