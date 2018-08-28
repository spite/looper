import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: .1 });

palette.range = ["#FFFFFF", "#FE2F04", "#0D5B93", "#0E4366", "#C74619", "#F5B067", "#F5C893"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(3, 3);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const sphereGeometry = new THREE.BoxBufferGeometry(1, .5, 1);
const material = getInstancedMeshStandardMaterial({ color: 0xcccccc, metalness: .1, roughness: .2 });
const depthMaterial = getInstancedDepthMaterial();
const instancedGeometry = new InstancedGeometry(sphereGeometry, { colors: false });
const instancedMesh = new THREE.Mesh(instancedGeometry.geometry, material);
instancedMesh.frustumCulled = false;
instancedMesh.castShadow = true;
instancedMesh.receiveShadow = true;
instancedMesh.customDepthMaterial = depthMaterial;
group.add(instancedMesh);

const posValues = instancedGeometry.positions.values;
const quatValues = instancedGeometry.quaternions.values;
const scaleValues = instancedGeometry.scales.values;

function add(ptr, x, y, z, scale, angle) {
  posValues[ptr * 3] = x;
  posValues[ptr * 3 + 1] = y;
  posValues[ptr * 3 + 2] = z;

  const quaternion = new THREE.Quaternion();
  quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);

  quatValues[ptr * 4 + 0] = quaternion.x;
  quatValues[ptr * 4 + 1] = quaternion.y;
  quatValues[ptr * 4 + 2] = quaternion.z;
  quatValues[ptr * 4 + 3] = quaternion.w;

  scaleValues[ptr * 3 + 0] = scale;
  scaleValues[ptr * 3 + 1] = scale;
  scaleValues[ptr * 3 + 2] = scale;
}

let ptr = 0;
const RINGS = 16;
const OBJECTS = 12;
for (let ring = 0; ring < RINGS; ring++) {
  const r = .5 * Math.exp(.4 * ring);
  for (let object = 0; object < OBJECTS; object++) {
    const a = object * Maf.TAU / OBJECTS + (ring % 2 ? 0 : Math.PI / OBJECTS);
    const x = .5 * r * Math.cos(a);
    const y = 0;
    const z = .5 * r * Math.sin(a);
    const s = .2 * r;
    add(ptr, x, y, z, s, -a + Math.PI / 4);
    ptr++;
  }
}

const N = RINGS * OBJECTS;
instancedGeometry.update(N);

group.scale.setScalar(1);

scene.add(group);

const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
directionalLight.position.set(-2, 2, 2);
directionalLight.castShadow = true;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(palette.range[0], palette.range[1], .5);
scene.add(light);

camera.position.set(3, 6, 3);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0, 1);
scene.fog = new THREE.FogExp2(palette.range[5], 0.06);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  group.rotation.y = t * Maf.TAU / OBJECTS;
  const z = .075 * Math.exp(.4 * 2 * t);
  group.scale.setScalar(z);

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };