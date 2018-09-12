import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import { gradientLinear } from '../modules/gradient.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';
import easings from '../modules/easings.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: .1 });

palette.range = ["#F9F4E7", "#F29D24", "#E9660A", "#FABC3F", "#F5DDA9", "#C63512", "#FECC54", "#3F1B0D"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(4, 4);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const gradient = new gradientLinear(palette.range);

const geometry = new THREE.IcosahedronBufferGeometry(.45, 2);
const material = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: .1, roughness: .6 }, { colors: true });
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

const D = 20;
const SIZE = 2 * D;
let OBJECTS = 0;
let ptr = 0;
const H = 20;
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = .78 * (x - .5 * SIZE);
    const dy = .90 * ((y - .5 * SIZE) + (x % 2 === 1 ? .5 : 0));
    const d = Math.sqrt(dx * dx + dy * dy);
    const a = Math.atan2(dy, dx);
    const sa = Math.round(a * 6 / Maf.TAU);
    const valid = d < H;;
    if (valid) {
      posValues[ptr * 3] = dx;
      posValues[ptr * 3 + 1] = 0;
      posValues[ptr * 3 + 2] = dy;
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
      OBJECTS++;
    }
  }
}

instancedGeometry.update(OBJECTS);

group.scale.setScalar(.5);

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

const light = new THREE.HemisphereLight(palette.range[0], palette.range[1], .5);
scene.add(light);

camera.position.set(1.6, 7, 7);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(palette.range[0], 1);
scene.fog = new THREE.FogExp2(palette.range[0], 0.065);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 1;

const q = new THREE.Quaternion();
const axis = new THREE.Vector3(1, 0, 0);

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  for (let ptr = 0; ptr < OBJECTS; ptr++) {
    const dx = posValues[ptr * 3];
    const dy = posValues[ptr * 3 + 2];
    const d = Math.sqrt(dx * dx + dy * dy);
    const phase = 2 * .05 * d;
    const v = phase + Math.atan2(dy, dx) / Maf.TAU;

    const r = t * Maf.PI - v * Maf.PI;

    const s = Maf.parabola(Maf.map(0, Maf.PI, 0, 1., Maf.mod(r, Maf.PI)), 1);
    scaleValues[ptr * 3] = s;
    scaleValues[ptr * 3 + 1] = s;
    scaleValues[ptr * 3 + 2] = s;

    posValues[ptr * 3 + 1] = 2 * s;

    const c = gradient.getAt(.25);
    colorValues[ptr * 4 + 0] = c.r;
    colorValues[ptr * 4 + 1] = c.g;
    colorValues[ptr * 4 + 2] = c.b;
  }

  instancedGeometry.positions.update(OBJECTS);
  //instancedGeometry.quaternions.update(OBJECTS);
  instancedGeometry.scales.update(OBJECTS);
  instancedGeometry.colors.update(OBJECTS);

  // group.rotation.y = t * Maf.TAU / 6;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };