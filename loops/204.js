import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import easings from '../modules/easings.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.1 });

palette.range = ["#4A453E", "#904838", "#CFB498", "#34302B", "#AC8A75", "#4A453E"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(2.5, 2.5);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const geometry = new THREE.BoxBufferGeometry(.5, .5, 1);
const material = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: .1, roughness: .4 }, { colors: !true });
const depthMaterial = getInstancedDepthMaterial();
const instancedGeometry = new InstancedGeometry(geometry, { colors: !true });
const instancedMesh = new THREE.Mesh(instancedGeometry.geometry, material);
instancedMesh.frustumCulled = false;
instancedMesh.castShadow = true;
instancedMesh.receiveShadow = true;
instancedMesh.customDepthMaterial = depthMaterial;
group.add(instancedMesh);

const posValues = instancedGeometry.positions.values;
const quatValues = instancedGeometry.quaternions.values;
const scaleValues = instancedGeometry.scales.values;

const RING = 100;
const INNER_ARMS = 12;
const OUTER_ARMS = 12;
const OFFSET_OUTER_ARMS = 16;
const INNER_PIECES_ARM = 18;
const OUTER_PIECES_ARM = 20;
const OBJECTS = RING + INNER_ARMS * INNER_PIECES_ARM + OUTER_ARMS * OUTER_PIECES_ARM + OFFSET_OUTER_ARMS * OUTER_PIECES_ARM;

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
  ptr++;
}

instancedGeometry.update(OBJECTS);

group.scale.setScalar(.1);

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

camera.position.set(0, 1, 0);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(palette.range[0], 1);
scene.fog = new THREE.FogExp2(palette.range[0], .5);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

const q = new THREE.Quaternion();
const m = new THREE.Matrix4();
const up = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3(0, 0, 0);
const mRot = new THREE.Matrix4();
const dir = new THREE.Vector3();

function setRing(start) {
  for (let ptr = start, i = 0; ptr < start + RING; ptr++, i++) {
    const a = i * Maf.TAU / RING;
    const r = 9;
    posValues[ptr * 3 + 0] = r * Math.cos(a);
    posValues[ptr * 3 + 1] = 0;
    posValues[ptr * 3 + 2] = r * Math.sin(a);

    m.makeRotationAxis(up, -a);
    q.setFromRotationMatrix(m);
    quatValues[ptr * 4 + 0] = q.x;
    quatValues[ptr * 4 + 1] = q.y;
    quatValues[ptr * 4 + 2] = q.z;
    quatValues[ptr * 4 + 3] = q.w;

    const s = 2;
    scaleValues[ptr * 3 + 0] = 1 * s;
    scaleValues[ptr * 3 + 1] = s;
    scaleValues[ptr * 3 + 2] = s;
  }
}

function setInnerArm(start, angle, sign, t) {
  const r = 10;
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);
  for (let ptr = start, i = 0; ptr < start + INNER_PIECES_ARM; ptr++, i++) {
    const a = angle - Maf.PI + sign * (Maf.TAU / 32 + i * (Maf.TAU / 6) / INNER_PIECES_ARM);
    const r = 10;
    posValues[ptr * 3 + 0] = x + r * Math.cos(a);
    posValues[ptr * 3 + 1] = 0;
    posValues[ptr * 3 + 2] = z + r * Math.sin(a);

    m.makeRotationAxis(up, -a);
    q.setFromRotationMatrix(m);
    quatValues[ptr * 4 + 0] = q.x;
    quatValues[ptr * 4 + 1] = q.y;
    quatValues[ptr * 4 + 2] = q.z;
    quatValues[ptr * 4 + 3] = q.w;

    const s = 1.5 + .5 * Math.sin(i * Maf.TAU / (OUTER_PIECES_ARM + INNER_PIECES_ARM) + t * Maf.TAU);
    scaleValues[ptr * 3 + 0] = s;
    scaleValues[ptr * 3 + 1] = s;
    scaleValues[ptr * 3 + 2] = s;
  }
}

function setOuterArm(start, angle, sign, t) {
  const r = 10;
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);
  for (let ptr = start, i = 0; ptr < start + OUTER_PIECES_ARM; ptr++, i++) {
    const a = angle - Maf.PI + sign * Maf.TAU / 6 + sign * i * (Maf.TAU / 6) / OUTER_PIECES_ARM;
    const r = 10;
    posValues[ptr * 3 + 0] = x + r * Math.cos(a);
    posValues[ptr * 3 + 1] = 0;
    posValues[ptr * 3 + 2] = z + r * Math.sin(a);

    m.makeRotationAxis(up, -a);
    q.setFromRotationMatrix(m);
    quatValues[ptr * 4 + 0] = q.x;
    quatValues[ptr * 4 + 1] = q.y;
    quatValues[ptr * 4 + 2] = q.z;
    quatValues[ptr * 4 + 3] = q.w;

    const s = 1.5 + .5 * Math.sin((i + INNER_PIECES_ARM) * Maf.TAU / (OUTER_PIECES_ARM + INNER_PIECES_ARM) + t * Maf.TAU);
    scaleValues[ptr * 3 + 0] = s;
    scaleValues[ptr * 3 + 1] = s;
    scaleValues[ptr * 3 + 2] = s;
  }
}

function setOffsetOuterArm(start, angle, sign, t) {
  const r = 10;
  const x = r * Math.cos(angle + Maf.PI);
  const z = r * Math.sin(angle + Maf.PI);
  for (let ptr = start, i = 0; ptr < start + OUTER_PIECES_ARM; ptr++, i++) {
    const a = angle + sign * Maf.TAU / 6 + sign * i * (Maf.TAU / 6) / OUTER_PIECES_ARM;
    const r = 10;
    posValues[ptr * 3 + 0] = x + r * Math.cos(a);
    posValues[ptr * 3 + 1] = 0;
    posValues[ptr * 3 + 2] = z + r * Math.sin(a);

    m.makeRotationAxis(up, -a);
    q.setFromRotationMatrix(m);
    quatValues[ptr * 4 + 0] = q.x;
    quatValues[ptr * 4 + 1] = q.y;
    quatValues[ptr * 4 + 2] = q.z;
    quatValues[ptr * 4 + 3] = q.w;

    const s = 1.5 + .5 * Math.sin((i + INNER_PIECES_ARM) * Maf.TAU / (OUTER_PIECES_ARM + INNER_PIECES_ARM) + t * Maf.TAU);
    scaleValues[ptr * 3 + 0] = s;
    scaleValues[ptr * 3 + 1] = s;
    scaleValues[ptr * 3 + 2] = s;
  }
}

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  let ptr = 0;
  setRing(ptr);
  ptr += RING;
  for (let i = 0; i < INNER_ARMS; i++) {
    const range = 3 * Maf.TAU / 4;
    let a = t * Maf.TAU + i * range / INNER_ARMS;
    let sign = 1;
    if (i >= .5 * INNER_ARMS) {
      a = -(t * Maf.TAU + i * range / INNER_ARMS + Maf.PI / 2);
      sign = -1;
    }
    setInnerArm(ptr, a, sign, t);
    ptr += INNER_PIECES_ARM;
  }
  for (let i = 0; i < OUTER_ARMS; i++) {
    const range = 3 * Maf.TAU / 4;
    let a = t * Maf.TAU + i * range / OUTER_ARMS;
    let sign = 1;
    if (i >= .5 * OUTER_ARMS) {
      a = -(t * Maf.TAU + i * range / OUTER_ARMS + Maf.PI / 2);
      sign = -1;
    }
    setOuterArm(ptr, a, sign, t);
    ptr += OUTER_PIECES_ARM;
  }
  for (let i = 0; i < OFFSET_OUTER_ARMS; i++) {
    const range = 3 * Maf.TAU / 4;
    let a = t * Maf.TAU + i * range / OFFSET_OUTER_ARMS;
    let sign = 1;
    if (i >= .5 * OFFSET_OUTER_ARMS) {
      a = -(t * Maf.TAU + i * range / OFFSET_OUTER_ARMS + Maf.PI / 2);
      sign = -1;
    }
    setOffsetOuterArm(ptr, a, sign, t);
    ptr += OUTER_PIECES_ARM;
  }

  instancedGeometry.positions.update(OBJECTS);
  instancedGeometry.quaternions.update(OBJECTS);
  instancedGeometry.scales.update(OBJECTS);

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };