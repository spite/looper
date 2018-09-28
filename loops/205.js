import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import { gradientLinear } from '../modules/gradient.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';
import easings from '../modules/easings.js';
import pointsOnSphere from '../modules/points-sphere.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.1 });

palette.range = ["#4A453E", "#904838", "#CFB498", "#34302B", "#AC8A75", "#4A453E"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(.6, .6);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const gradient = new gradientLinear(palette.range);

const geometry = new THREE.TorusBufferGeometry(.5, .2);
const material = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: .1, roughness: .4 }, { colors: true });
material.flatShading = true;
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

const CENTERS = 100;
const ORBITALS = 16;
const OBJECTS = CENTERS * ORBITALS;
const points = pointsOnSphere(CENTERS);

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

camera.position.set(.7, .7, .25);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(palette.range[0], 1);
scene.fog = new THREE.FogExp2(palette.range[0], .5);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

const q = new THREE.Quaternion();
const m = new THREE.Matrix4();
const up = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3(0, 0, 0);
const mRot = new THREE.Matrix4();
const dir = new THREE.Vector3();

const spherePoints = pointsOnSphere(64);
let frame = 0;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  let ptr = 0;
  for (let j = 0; j < CENTERS; j++) {

    const p = points[j];
    const a = Math.atan2(p.x, p.z);
    const b = Math.atan2(p.y, p.z);
    const s = .5 + .5 * Math.sin(t * Maf.TAU + 2 * a + b);
    for (let i = 0; i < ORBITALS; i++) {

      const alpha = i * Maf.TAU / ORBITALS + 4 * t * Maf.TAU / ORBITALS;
      dir.set(p.x, p.y, p.z)
      tmp.crossVectors(dir, up).normalize();
      tmp.applyAxisAngle(dir, alpha).multiplyScalar(.2 + .5 * s);
      const x = (3 + 2 * s) * p.x + tmp.x;
      const y = (3 + 2 * s) * p.y + tmp.y;
      const z = (3 + 2 * s) * p.z + tmp.z;
      tmp.set(x, y, z);

      posValues[ptr * 3 + 0] = tmp.x;
      posValues[ptr * 3 + 1] = tmp.y;
      posValues[ptr * 3 + 2] = tmp.z;

      m.lookAt(p, group.position, up);
      mRot.makeRotationZ(alpha + Maf.PI / 2);
      m.multiply(mRot);
      mRot.makeRotationX((t * Maf.PI) + (i % 2 === 0 ? Maf.PI / 2 : 0));
      m.multiply(mRot);
      q.setFromRotationMatrix(m);

      quatValues[ptr * 4 + 0] = q.x;
      quatValues[ptr * 4 + 1] = q.y;
      quatValues[ptr * 4 + 2] = q.z;
      quatValues[ptr * 4 + 3] = q.w;

      const s2 = .2 + .3 * s;
      scaleValues[ptr * 3 + 0] = s2;
      scaleValues[ptr * 3 + 1] = s2;
      scaleValues[ptr * 3 + 2] = s2;

      const c = gradient.getAt(Maf.mod(t + a / Maf.TAU, 1));
      const hsl = c.getHSL();
      c.setHSL(hsl.h, hsl.s, hsl.l * (.5 + .5 * s));
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

  //group.rotation.y = t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };