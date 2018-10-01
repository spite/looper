import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import { gradientLinear } from '../modules/gradient.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
import easings from '../modules/easings.js';
import pointsOnSphere from '../modules/points-sphere.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.2 });

palette.range = ["#FE9B6A", "#2A2E43", "#BB4E75", "#2A6C8C", "#D1CDA6", "#FFFEFE", "#83A2AD"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(5, 5);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const gradient = new gradientLinear(palette.range);

const geometry = new RoundedBoxGeometry(.25, .25, .1, .01, 4);
const material = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: .1, roughness: .8 }, { colors: true });
const depthMaterial = getInstancedDepthMaterial();
const instancedGeometry = new InstancedGeometry(geometry, { colors: true });
const instancedMesh = new THREE.Mesh(instancedGeometry.geometry, material);
instancedMesh.frustumCulled = false;
instancedMesh.castShadow = true;
instancedMesh.receiveShadow = true;
instancedMesh.customDepthMaterial = depthMaterial;
group.add(instancedMesh);

const posValues = instancedGeometry.positions.values;
const quatValues = instancedGeometry.quaternions.values;
const scaleValues = instancedGeometry.scales.values;
const colorValues = instancedGeometry.colors.values;

const POINTS = 1000;
const LAYERS = 1;
const OBJECTS = POINTS * LAYERS;
const points = pointsOnSphere(POINTS);

const data = [];
for (let i = 0; i < POINTS; i++) {
  data[i] = {
    offset: Maf.randomInRange(0, 1),
    r: Maf.randomInRange(0, 1),
    scale: Maf.randomInRange(.5, 1.5),
    rotation: Maf.randomInRange(0, Maf.TAU),
  }
}

let ptr = 0;
for (let j = 0; j < OBJECTS; j++) {
  posValues[ptr * 3] = 0;
  posValues[ptr * 3 + 1] = 0;
  posValues[ptr * 3 + 2] = 0;
  scaleValues[ptr * 3] = 1;
  scaleValues[ptr * 3 + 1] = 1;
  scaleValues[ptr * 3 + 2] = 1;
  quatValues[ptr * 4] = 0;
  quatValues[ptr * 4 + 1] = 0;
  quatValues[ptr * 4 + 2] = 0;
  quatValues[ptr * 4 + 3] = 1;
  colorValues[ptr * 4] = .5;
  colorValues[ptr * 4 + 1] = .5;
  colorValues[ptr * 4 + 2] = .5;
  colorValues[ptr * 4 + 3] = 1;
  ptr++;
}

instancedGeometry.update(OBJECTS);

group.scale.setScalar(1);

scene.add(group);

const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
directionalLight.position.set(-2, 2, 2);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = -1;
directionalLight.shadow.camera.far = 10;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
directionalLight2.shadow.camera.near = -4;
directionalLight2.shadow.camera.far = 10;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(palette.range[2], palette.range[1], .5);
scene.add(light);

camera.position.set(-.5, .5, .5);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(palette.range[6], 1);
scene.fog = new THREE.FogExp2(palette.range[6], .3);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2.5;

const q = new THREE.Quaternion();
const m = new THREE.Matrix4();
const up = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3(0, 0, 0);
const mRot = new THREE.Matrix4();
const dir = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  let ptr = 0;
  for (let j = 0; j < LAYERS; j++) {

    for (let i = 0; i < POINTS; i++) {

      const offset = data[i].offset;
      const t2 = Maf.mod(t + offset, 1);
      const p = points[i];
      const d = data[i].r;

      const r = (offset + d * j + 2 + d * t2);
      const x = r * p.x;
      const y = r * p.y;
      const z = r * p.z;

      posValues[ptr * 3 + 0] = x;
      posValues[ptr * 3 + 1] = y;
      posValues[ptr * 3 + 2] = z;

      tmp.set(x, y, z);
      m.lookAt(tmp, group.position, up);
      mRot.makeRotationZ(t2 * Maf.TAU / 8 + data[i].rotation);
      m.multiply(mRot);
      q.setFromRotationMatrix(m);

      quatValues[ptr * 4 + 0] = q.x;
      quatValues[ptr * 4 + 1] = q.y;
      quatValues[ptr * 4 + 2] = q.z;
      quatValues[ptr * 4 + 3] = q.w;

      const s = 2 * Maf.parabola(Maf.mod(t2 / LAYERS + j / LAYERS, 1), 1) * data[i].scale;
      scaleValues[ptr * 3 + 0] = s;
      scaleValues[ptr * 3 + 1] = s;
      scaleValues[ptr * 3 + 2] = s;

      const c = gradient.getAt(Maf.mod(t2 / LAYERS + j / LAYERS, 1), 1);
      colorValues[ptr * 4 + 0] = c.r;
      colorValues[ptr * 4 + 1] = c.g;
      colorValues[ptr * 4 + 2] = c.b;

      ptr++;
    }
  }

  instancedGeometry.positions.update(OBJECTS);
  instancedGeometry.quaternions.update(OBJECTS);
  instancedGeometry.scales.update(OBJECTS);
  instancedGeometry.colors.update(OBJECTS);

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };