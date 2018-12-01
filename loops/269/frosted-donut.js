import THREE from '../../third_party/three.js';
import { createDonutGeometry, createFrostingGeometry, bumpGeometry } from './donut.js';

function createFrostedDonut(donutMaterial, frostingMaterial, seed, amount) {

  const group = new THREE.Group();

  const donut = new THREE.Mesh(
    bumpGeometry(createDonutGeometry(2, 1, seed), amount, seed),
    donutMaterial
  );
  donut.castShadow = donut.receiveShadow = true;
  group.add(donut);

  const frosting = new THREE.Mesh(
    bumpGeometry(createFrostingGeometry(2, 1, seed), amount, seed),
    frostingMaterial
  );
  frosting.castShadow = frosting.receiveShadow = true;
  group.add(frosting);

  return {
    donut,
    donutMaterial,
    frosting,
    frostingMaterial,
    group
  };
}

export { createFrostedDonut };