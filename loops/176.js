import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: .1 });

palette.range = ["#FFFFFF", "#FE2F04", "#0D5B93", "#0E4366", "#C74619", "#F5B067", "#F5C893"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(2.5, 2.5);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const geometry = new RoundedBoxGeometry(1, 3, .5, .1, 5);
const material = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: .2, roughness: .5 }, { colors: true });
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

function add(ptr) {
  posValues[ptr * 3 + 0] = 0;
  posValues[ptr * 3 + 1] = 0;
  posValues[ptr * 3 + 2] = 0;

  quatValues[ptr * 4 + 0] = 0;
  quatValues[ptr * 4 + 1] = 0;
  quatValues[ptr * 4 + 2] = 0;
  quatValues[ptr * 4 + 3] = 1;

  scaleValues[ptr * 3 + 0] = .1;
  scaleValues[ptr * 3 + 1] = .1;
  scaleValues[ptr * 3 + 2] = .1;

  colorValues[ptr * 4 + 0] = .8;
  colorValues[ptr * 4 + 1] = .8;
  colorValues[ptr * 4 + 2] = .8;
  colorValues[ptr * 4 + 3] = 1;
}

let ptr = 0;
const OBJECTS = 2000;
const r = 3;
for (let object = 0; object < OBJECTS; object++) {
  add(ptr);
  ptr++;

}

const N = OBJECTS;
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

camera.position.set(0, 3, 3);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(palette.range[5], 1);
scene.fog = new THREE.FogExp2(palette.range[5], 0.1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

const r1 = 1;
const r2 = .5;
const twists = 5;

function getPos(t, r1, r2, offset) {
  const a = t * Maf.TAU + offset;
  const r = r1 + r2 * Math.sin(twists * a);
  const x = r * Math.cos(a + offset);
  const y = r2 * Math.cos(twists * a);
  const z = r * Math.sin(a + offset);
  return { x, y, z }
}

const q = new THREE.Quaternion();
const qq = new THREE.Quaternion();
const tmp = new THREE.Vector3();
const m = new THREE.Matrix4();
const m2 = new THREE.Matrix4();
const up = new THREE.Vector3(.1, 1, .1).normalize();
const c = new THREE.Color;
const spirals = 3;
const e = new THREE.Euler();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  for (let ptr = 0; ptr < N; ptr++) {
    const a = (10 * t) / (.5 * N) + (ptr / N);
    const offset = (ptr % 2 === 0 ? Maf.PI / twists : 0);
    const rr1 = r1;
    const rr2 = r2 + .25 * r2 * Math.sin(2 * t * Maf.TAU + ptr * Maf.TAU / N);
    const p = getPos(a, rr1, rr2, offset);
    const pp = getPos(a + 1 / N, rr1, rr2, offset);
    posValues[ptr * 3 + 0] = p.x;
    posValues[ptr * 3 + 1] = p.y;
    posValues[ptr * 3 + 2] = p.z;

    tmp.set(p.x, p.y, p.z).sub(pp).normalize();
    m.lookAt(new THREE.Vector3(0, 0, 0), tmp, up);
    m2.makeRotationAxis(tmp, t * Maf.TAU);
    m.multiply(m2);
    q.setFromRotationMatrix(m).normalize();

    quatValues[ptr * 4 + 0] = q.x;
    quatValues[ptr * 4 + 1] = q.y;
    quatValues[ptr * 4 + 2] = q.z;
    quatValues[ptr * 4 + 3] = q.w;

    const d = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    const s = .05 + .05 * d * d;
    scaleValues[ptr * 3 + 0] = s;
    scaleValues[ptr * 3 + 1] = s;
    scaleValues[ptr * 3 + 2] = s;

    c.setHSL(a, .5, .5);
    if (ptr % 2) {
      colorValues[ptr * 4 + 0] = 0xb7 / 0xff;
      colorValues[ptr * 4 + 1] = 0;
      colorValues[ptr * 4 + 2] = 0;
    } else {
      colorValues[ptr * 4 + 0] = 1;
      colorValues[ptr * 4 + 1] = 1;
      colorValues[ptr * 4 + 2] = 1;
    }
  }

  instancedGeometry.positions.update(N);
  instancedGeometry.quaternions.update(N);
  instancedGeometry.scales.update(N);
  instancedGeometry.colors.update(N);

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };