import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import { Curves } from '../third_party/THREE.CurveExtras.js';
import { gradientLinear } from '../modules/gradient.js';
import easings from '../modules/easings.js';
import pointsOnSphere from '../modules/points-sphere.js';
import noise from '../third_party/perlin.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.1 });

palette.range = ["#120A5A", "#4B27A9", "#9F52D5", "#CD64B5", "#F9757D"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(4, 4);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const gradient = new gradientLinear(palette.range);

const geometry = new THREE.IcosahedronBufferGeometry(1, 1);
const material = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: .5 }, { colors: true });
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

const OBJECTS = 2000;
instancedGeometry.update(OBJECTS);

const points = pointsOnSphere(OBJECTS);

group.scale.setScalar(2);

scene.add(group);

const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
directionalLight.position.set(-2, 2, 2);
directionalLight.castShadow = true;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
directionalLight2.shadow.camera.near = -1;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(palette.range[5], palette.range[6], .5);
scene.add(light);

camera.position.set(-3.15, 2.05, 2.00);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0xF2C5C5, 1);
scene.fog = new THREE.FogExp2(0xF2C5C5, 0.);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  for (let ptr = 0; ptr < OBJECTS; ptr++) {
    const p = points[ptr].clone();

    const f1 = Math.cos(easings.OutQuad(Maf.parabola(t, 2)) * 10 * p.x + t * Maf.TAU);
    const f2 = Math.cos(easings.OutQuad(Maf.parabola(t, 2)) * 10 * p.y + t * Maf.TAU);
    const f3 = Math.cos(easings.OutQuad(Maf.parabola(t, 2)) * 10 * p.z + t * Maf.TAU);
    const offset = f1 + f2 + f3;
    p.normalize().multiplyScalar(1 + .1 * offset);

    posValues[ptr * 3 + 0] = p.x;
    posValues[ptr * 3 + 1] = p.y;
    posValues[ptr * 3 + 2] = p.z;

    quatValues[ptr * 4 + 0] = 0;
    quatValues[ptr * 4 + 1] = 0;
    quatValues[ptr * 4 + 2] = 0;
    quatValues[ptr * 4 + 3] = 1;

    const s = .05 + Maf.map(-3, 3, 0, .05, offset);
    scaleValues[ptr * 3 + 0] = s;
    scaleValues[ptr * 3 + 1] = s;
    scaleValues[ptr * 3 + 2] = s;

    const c = gradient.getAt(Maf.map(-3, 3, 0, 1, offset));
    colorValues[ptr * 4 + 0] = c.r;
    colorValues[ptr * 4 + 1] = c.g;
    colorValues[ptr * 4 + 2] = c.b;
  }

  instancedGeometry.positions.update(OBJECTS);
  instancedGeometry.quaternions.update(OBJECTS);
  instancedGeometry.scales.update(OBJECTS);
  instancedGeometry.colors.update(OBJECTS);

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };