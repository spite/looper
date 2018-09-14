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

const painted = Painted(renderer, { minLevel: -.1 });

palette.range = ["#E12405", "#FAC201", "#572F35"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(1, 1);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const gradient = new gradientLinear(palette.range);

const geometry = new RoundedExtrudedPolygonGeometry(.5, .25, 6, 1, .05, .05, 4);
const mRot = new THREE.Matrix4().makeRotationX(Math.PI / 2);
geometry.applyMatrix(mRot);
const material = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: .1, roughness: .2 }, { colors: true });
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

const RINGS = 10;
let OBJECTS = 0;
let ptr = 0;
const data = [];
for (let j = 0; j < RINGS; j++) {
  const parts = Math.max(1, 6 * j);
  for (let p = 0; p < parts; p++) {
    const a = p * Maf.TAU / parts;
    const aa = Maf.mod(a, Maf.TAU / 6);
    const r = (Math.sqrt(3) * j) / (Math.sqrt(3) * Math.cos(aa) + Math.sin(aa));
    const x = r * Math.cos(a + Maf.TAU / 12);
    const y = r * Math.sin(a + Maf.TAU / 12);
    posValues[ptr * 3] = x;
    posValues[ptr * 3 + 1] = 0;
    posValues[ptr * 3 + 2] = y;
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
    data.push({ r: j });
    ptr++;
    OBJECTS++;
  }
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

const light = new THREE.HemisphereLight(palette.range[0], palette.range[1], .5);
scene.add(light);

camera.position.set(1, 1, 1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(palette.range[1], 1);
scene.fog = new THREE.FogExp2(palette.range[1], 0.065);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

const q = new THREE.Quaternion();
const axis = new THREE.Vector3(1, 0, 0);
const ARMS = 6;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  for (let ptr = 0; ptr < OBJECTS; ptr++) {

    const r = data[ptr].r;
    const h = easings.InOutQuad(.5 + .5 * Math.sin(.5 * r + t * Maf.TAU));
    posValues[ptr * 3 + 1] = 2 * (h - .5);

    const c = gradient.getAt(h);
    const hsl = c.getHSL();
    c.setHSL(hsl.h - .01, hsl.s - .2, hsl.l);
    colorValues[ptr * 4 + 0] = c.r;
    colorValues[ptr * 4 + 1] = c.g;
    colorValues[ptr * 4 + 2] = c.b;
  }

  instancedGeometry.positions.update(OBJECTS);
  //instancedGeometry.quaternions.update(OBJECTS);
  //instancedGeometry.scales.update(OBJECTS);
  instancedGeometry.colors.update(OBJECTS);

  group.rotation.y = -t * Maf.TAU / ARMS;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };