import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import { Curves } from '../third_party/THREE.CurveExtras.js';
import { gradientLinear } from '../modules/gradient.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: .1 });

palette.range = ["#FFFFFF", "#FE2F04", "#0D5B93", "#0E4366", "#C74619", "#F5B067", "#F5C893", "#FFFFFF"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(4, 4);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const gradient = new gradientLinear(palette.range);
const curve = new THREE.Curves.TorusKnot();

const geometry = new THREE.CylinderBufferGeometry(1, 1, .2, 36);
const mm = new THREE.Matrix4().makeRotationX(Math.PI / 2);
geometry.applyMatrix(mm);
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

const OBJECTS = 200;
instancedGeometry.update(OBJECTS);

group.scale.setScalar(10);

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

camera.position.set(.5, 2.4, 3.5);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(palette.range[5], 1);
scene.fog = new THREE.FogExp2(palette.range[5], 0.1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

const r1 = 1.5;
const r2 = .5;
const twists = 8;

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
const e = new THREE.Euler();
const center = new THREE.Vector3(0, 0, 0);

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  const vertices = [];

  const pts = OBJECTS;
  for (let ptr = 0; ptr < pts; ptr++) {
    const a = ptr / pts;
    const offset = 0;
    const rr1 = r1;
    const rr2 = r2 + .25 * r2 * Math.sin(2 * t * Maf.TAU + ptr * Maf.TAU / pts);
    const p = curve.getPoint(a);
    vertices.push(p.multiplyScalar(.01));
  }
  vertices.push(vertices[0].clone());

  var path = new THREE.CatmullRomCurve3(vertices);
  const frames = path.computeFrenetFrames(OBJECTS, true);

  for (let ptr = 0; ptr < OBJECTS; ptr++) {
    const p = path.getPointAt(ptr / OBJECTS);
    posValues[ptr * 3 + 0] = p.x;
    posValues[ptr * 3 + 1] = p.y;
    posValues[ptr * 3 + 2] = p.z;

    m.lookAt(p, path.getPointAt(Maf.mod(ptr + 1, OBJECTS) / OBJECTS), frames.binormals[ptr]);
    q.setFromRotationMatrix(m).normalize();

    quatValues[ptr * 4 + 0] = q.x;
    quatValues[ptr * 4 + 1] = q.y;
    quatValues[ptr * 4 + 2] = q.z;
    quatValues[ptr * 4 + 3] = q.w;

    const s = .05 + .025 * Math.sin(10 * ptr * Maf.TAU / OBJECTS + t * Maf.TAU);
    scaleValues[ptr * 3 + 0] = s;
    scaleValues[ptr * 3 + 1] = s;
    scaleValues[ptr * 3 + 2] = s;

    const c = gradient.getAt(ptr / OBJECTS);
    colorValues[ptr * 4 + 0] = c.r;
    colorValues[ptr * 4 + 1] = c.g;
    colorValues[ptr * 4 + 2] = c.b;
  }
  instancedGeometry.scales.update(OBJECTS);
  instancedGeometry.colors.update(OBJECTS);

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };