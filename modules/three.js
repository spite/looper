import THREE from '../third_party/three.js';

function getWebGLRenderer() {
  const renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(800, 800);
  const canvas = renderer.domElement;
  canvas.style.width = '400px';
  canvas.style.height = '400px';
  document.body.appendChild(canvas);
  return renderer;
}

const renderer = getWebGLRenderer();

function getCamera() {
  return new THREE.PerspectiveCamera(35,1,.1,100);
}

export { renderer, getCamera };
