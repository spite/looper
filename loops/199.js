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

const painted = Painted(renderer, { minLevel: -.2 });

palette.range = ["#F2E9D9", "#101010", "#EA4B04", "#B6AC9E", "#5A5754", "#837F7A", "#E78E36", "#552509"];
const canvas = renderer.domElement;
const camera = getOrthoCamera(.75, .75);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const gradient = new gradientLinear(palette.range);

const geometry = new THREE.IcosahedronBufferGeometry(.5, 2);
const material = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: .2, roughness: .8 }, { colors: true });
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

const OBJECTS = 1000;
const points = pointsOnSphere(OBJECTS);

const q = new THREE.Quaternion();
const m = new THREE.Matrix4();
const up = new THREE.Vector3(0, 1, 0);
const m2 = new THREE.Matrix4();

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

  //data.push({ r: j, a });
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

camera.position.set(-.76, .6, -.16);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(palette.range[0], 1);
scene.fog = new THREE.FogExp2(palette.range[0], .5);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  for (let ptr = 0; ptr < OBJECTS; ptr++) {

    const p = points[ptr];
    const a = Math.atan2(p.x, p.z);
    const b = Math.atan2(p.y, p.x);
    const v = Maf.mod(2 * ptr / OBJECTS + t + 1 * a / Maf.TAU + 1 * b / Maf.TAU, 1);
    const s = Maf.parabola(v, 1);
    const f = 2 + 3 * easings.OutQuad(s);

    posValues[ptr * 3 + 0] = f * p.x;
    posValues[ptr * 3 + 1] = f * p.y;
    posValues[ptr * 3 + 2] = f * p.z;

    m2.makeRotationY(easings.InOutQuad(v) * Math.PI / 4);
    m.lookAt(p, group.position, up);
    m.multiply(m2);
    q.setFromRotationMatrix(m);

    quatValues[ptr * 4 + 0] = q.x;
    quatValues[ptr * 4 + 1] = q.y;
    quatValues[ptr * 4 + 2] = q.z;
    quatValues[ptr * 4 + 3] = q.w;

    scaleValues[ptr * 3 + 0] = .5;
    scaleValues[ptr * 3 + 1] = .5;
    scaleValues[ptr * 3 + 2] = 3 * s;

    const c = gradient.getAt(v); //.5 + .5 * Math.sin(Maf.mod(.1 * s + b / Maf.TAU + a / Maf.TAU + t, 1) * Maf.TAU));
    colorValues[ptr * 4 + 0] = c.r;
    colorValues[ptr * 4 + 1] = c.g;
    colorValues[ptr * 4 + 2] = c.b;
  }

  instancedGeometry.positions.update(OBJECTS);
  instancedGeometry.quaternions.update(OBJECTS);
  instancedGeometry.scales.update(OBJECTS);
  instancedGeometry.colors.update(OBJECTS);

  //group.rotation.y = t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };