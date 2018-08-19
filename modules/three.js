import THREE from '../third_party/three.js';

function getWebGLRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(800, 800);
  const canvas = renderer.domElement;
  canvas.style.width = '400px';
  canvas.style.height = '400px';
  return renderer;
}

const renderer = getWebGLRenderer();

function getCamera(fov) {
  return new THREE.PerspectiveCamera(fov ? fov : 35, 1, .1, 100);
}

function getOrthoCamera(w, h) {
  return new THREE.OrthographicCamera(-w, w, h, -h, -100, 100);
}

export { renderer, getCamera, getOrthoCamera };