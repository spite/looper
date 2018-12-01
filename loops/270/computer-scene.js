import THREE from '../../third_party/three.js';
import noise from '../../third_party/perlin.js';
import { fbm, ridgedTurbulence } from '../../modules/perlin-functions.js';

import { vs as backdropVertexShader } from './backdrop-vs.js';
import { fs as backdropFragmentShader } from './backdrop-fs.js';
import { vs as sphereVertexShader } from './sphere-vs.js';
import { fs as sphereFragmentShader } from './sphere-fs.js';
import { vs as gradientVertexShader } from './gradient-vs.js';
import { fs as gradientFragmentShader } from './gradient-fs.js';

function createComputerScene() {

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(100, 4 / 3, .001, 10);
  camera.position.set(0, .1, 1);
  camera.lookAt(0, .05, 0);

  const backdrop = new THREE.Mesh(
    new THREE.IcosahedronBufferGeometry(2, 4),
    new THREE.RawShaderMaterial({
      vertexShader: backdropVertexShader,
      fragmentShader: backdropFragmentShader,
      side: THREE.BackSide,
    })
  );
  scene.add(backdrop);

  const sphere = new THREE.Mesh(
    new THREE.IcosahedronBufferGeometry(.5, 4),
    new THREE.RawShaderMaterial({
      vertexShader: sphereVertexShader,
      fragmentShader: sphereFragmentShader,
    })
  );
  scene.add(sphere);
  sphere.position.y = .5;
  sphere.position.z = -1;
  sphere.scale.setScalar(2, 2, 2);
  const landscape = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1, 1, 50, 50),
    new THREE.RawShaderMaterial({
      vertexShader: gradientVertexShader,
      fragmentShader: gradientFragmentShader,
      transparent: true,
      wireframe: false
    })
  );
  landscape.scale.setScalar(2, 2, 4);
  landscape.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Maf.PI / 2));
  const positions = landscape.geometry.attributes.position.array;
  const s = 2;
  for (let j = 0; j < positions.length; j += 3) {
    const h = .1 * fbm(s * positions[j + 0] + 3, s * positions[j + 1], s * positions[j + 2]);
    positions[j + 1] = Maf.clamp(h, 0, 1);
  }
  scene.add(landscape);

  const landscape2 = landscape.clone();
  landscape2.geometry.applyMatrix(new THREE.Matrix4().makeRotationY(Maf.PI));
  scene.add(landscape2);
  const landscape3 = landscape.clone();
  scene.add(landscape3);

  return {
    scene,
    camera,
    landscape,
    landscape2,
    landscape3
  }

}

export { createComputerScene }