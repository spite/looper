import THREE from '../../third_party/three.js';
import { createFrostedDonut } from './frosted-donut.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../../modules/instanced.js';
import RoundedExtrudedPolygonGeometry from '../../modules/three-rounded-extruded-polygon.js';
import { gradientLinear } from '../../modules/gradient.js';

const gradient = new gradientLinear(["#ef9837", "#481d67", "#007fb4", "#308546", "#fed500"]);

function createSprinkledFrostedDonut(donutMaterial, frostingMaterial, seed, amount, numSprinkles) {

  const donut = createFrostedDonut(donutMaterial, frostingMaterial, seed, amount);

  const points = [];
  const raycast = new THREE.Raycaster();
  const r = 6;
  const position = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const m2 = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion();
  for (let j = 0; j < numSprinkles; j++) {
    const x = Maf.randomInRange(-r, r);
    const z = r;
    const y = Maf.randomInRange(-r, r);
    raycast.ray.origin.set(x, y, z);
    raycast.ray.direction.set(0, 0, -1).normalize();
    const intersects = raycast.intersectObject(donut.frosting);
    if (intersects.length) {
      const p = intersects[0].point;
      position.copy(p);
      tmp.copy(intersects[0].face.normal).multiplyScalar(.05);
      position.add(tmp);
      tmp.copy(p).add(intersects[0].face.normal);
      m.lookAt(p, tmp, up);
      m2.makeRotationZ(Maf.randomInRange(0, Maf.TAU))
      m.multiply(m2);
      quaternion.setFromRotationMatrix(m);
      points.push({
        position: position.clone(),
        scale: .1,
        quaternion: quaternion.clone()
      })
    }
  }

  const SPRINKLES = points.length;

  const sprinkleGeometry = new RoundedExtrudedPolygonGeometry(.5, 4, 18, 1, .5, .5, 5);
  sprinkleGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(Maf.PI / 2));
  const material = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: .1 }, { colors: true });
  const depthMaterial = getInstancedDepthMaterial();
  const instancedGeometry = new InstancedGeometry(sprinkleGeometry, { size: SPRINKLES, colors: true });
  const instancedMesh = new THREE.Mesh(instancedGeometry.geometry, material);
  instancedMesh.frustumCulled = false;
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;
  instancedMesh.customDepthMaterial = depthMaterial;
  donut.group.add(instancedMesh);

  const posValues = instancedGeometry.positions.values;
  const quatValues = instancedGeometry.quaternions.values;
  const scaleValues = instancedGeometry.scales.values;
  const colorValues = instancedGeometry.colors.values;

  const col = new THREE.Color();
  let ptr = 0;
  for (const p of points) {
    posValues[ptr * 3 + 0] = p.position.x;
    posValues[ptr * 3 + 1] = p.position.y;
    posValues[ptr * 3 + 2] = p.position.z;

    quatValues[ptr * 4 + 0] = p.quaternion.x;
    quatValues[ptr * 4 + 1] = p.quaternion.y;
    quatValues[ptr * 4 + 2] = p.quaternion.z;
    quatValues[ptr * 4 + 3] = p.quaternion.w;

    scaleValues[ptr * 3 + 0] = p.scale;
    scaleValues[ptr * 3 + 1] = p.scale;
    scaleValues[ptr * 3 + 2] = p.scale;

    col.setHSL(Maf.randomInRange(0, Maf.TAU), Maf.randomInRange(.5, .75), Maf.randomInRange(.45, .55));
    colorValues[ptr * 4 + 0] = col.r;
    colorValues[ptr * 4 + 1] = col.g;
    colorValues[ptr * 4 + 2] = col.b;
    colorValues[ptr * 4 + 3] = 1;

    ptr++;
  }

  instancedGeometry.update(SPRINKLES);

  return {
    donut,
    instancedMesh,
    instancedGeometry,
    material
  };
}

export { createSprinkledFrostedDonut };