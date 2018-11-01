import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import { gradientLinear } from '../modules/gradient.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
import easings from '../modules/easings.js';
import getLemniscatePoint from '../modules/lemniscate.js';

import Default from '../modules/default.js';

const post = Default(renderer, { minLevel: .1 });

palette.range = ["#D82C06", "#FFCF3C", "#F45B0B", "#F49A4A"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(1, 1);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const gradient = new gradientLinear(palette.range);

const geometry = new RoundedBoxGeometry(.25, .25, .05, .01, 4);
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

const OBJECTS = 300;

for (let ptr = 0; ptr < OBJECTS; ptr++) {
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

camera.position.set(.5, .3, .6);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x776E88, 1);
scene.fog = new THREE.FogExp2(0x776E88, .3);
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

  for (let ptr = 0; ptr < OBJECTS; ptr++) {
    const a = ptr * (.45 * Maf.TAU) / OBJECTS + t * Maf.TAU;
    const p = getLemniscatePoint(a);

    posValues[ptr * 3 + 0] = p.x;
    posValues[ptr * 3 + 1] = p.y;
    posValues[ptr * 3 + 2] = 0;

    tmp.set(p.x, p.y, 0);
    const pp = getLemniscatePoint(a + Maf.TAU / OBJECTS);
    m.lookAt(tmp, new THREE.Vector3(pp.x, pp.y, 0), up);
    mRot.makeRotationZ(ptr * Maf.TAU / OBJECTS + t * 4 * Maf.TAU);
    m.multiply(mRot);
    q.setFromRotationMatrix(m);

    quatValues[ptr * 4 + 0] = q.x;
    quatValues[ptr * 4 + 1] = q.y;
    quatValues[ptr * 4 + 2] = q.z;
    quatValues[ptr * 4 + 3] = q.w;

    const s = Maf.parabola(Maf.mod(ptr / OBJECTS, 1), .1);
    scaleValues[ptr * 3 + 0] = s;
    scaleValues[ptr * 3 + 1] = s;
    scaleValues[ptr * 3 + 2] = 1;

    const c = gradient.getAt(ptr / OBJECTS);
    colorValues[ptr * 4 + 0] = c.r;
    colorValues[ptr * 4 + 1] = c.g;
    colorValues[ptr * 4 + 2] = c.b;

  }

  instancedGeometry.positions.update(OBJECTS);
  instancedGeometry.quaternions.update(OBJECTS);
  instancedGeometry.scales.update(OBJECTS);
  instancedGeometry.colors.update(OBJECTS);

  post.render(scene, camera);
}

export { draw, loopDuration, canvas };