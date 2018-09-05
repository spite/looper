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
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.2 });

palette.range = ["#FFFFFF", "#FE2F04", "#0D5B93", "#0E4366", "#C74619", "#F5B067", "#F5C893"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(4, 4);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const gradient = new gradientLinear(palette.range);

const geometry = new RoundedBoxGeometry(.5, .5, .5, .05, 4);
const material = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: .6 }, { colors: true });
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

group.scale.setScalar(5.5);

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
renderer.setClearColor(palette.range[3], 1);
scene.fog = new THREE.FogExp2(palette.range[3], 0.);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;
  const t2 = Maf.mod(t + .5, 1);

  for (let ptr = 0; ptr < OBJECTS; ptr++) {
    const p = points[ptr].clone();

    const sc = 1. + .4 * Math.cos(t * Maf.TAU);
    const nc = 1 + .5 * noise.perlin3(sc * p.x + Math.sin(t * Maf.TAU), sc * p.y, sc * p.z);

    const ss = 1;
    const freq = 2;
    const n1 = .5 + .5 * noise.perlin3(ss * p.x + freq * t, ss * p.y, ss * p.z + freq * t);
    const n2 = .5 + .5 * noise.perlin3(ss * p.x + freq * t2, ss * p.y + freq * t2, ss * p.z);
    const n = Maf.clamp(n1 * Maf.parabola(t, 4) + n2 * Maf.parabola(Maf.mod(t + .5, 1), 4), 0, 1);
    const sss = .5 + .25 * Math.sin(2 * t * Maf.TAU);
    p.normalize().multiplyScalar(.25 + n * .5);

    posValues[ptr * 3 + 0] = p.x;
    posValues[ptr * 3 + 1] = p.y;
    posValues[ptr * 3 + 2] = p.z;

    quatValues[ptr * 4 + 0] = 0;
    quatValues[ptr * 4 + 1] = 0;
    quatValues[ptr * 4 + 2] = 0;
    quatValues[ptr * 4 + 3] = 1;

    const s = .05 + .05 * n;
    scaleValues[ptr * 3 + 0] = s;
    scaleValues[ptr * 3 + 1] = s;
    scaleValues[ptr * 3 + 2] = s;

    const offset = 0;
    const c = gradient.getAt(Maf.map(.5, 1.5, 0, 1, nc));
    const hsl = c.getHSL();
    c.setHSL(hsl.h, hsl.s + .2 * n, hsl.l + .1 * n);
    colorValues[ptr * 4 + 0] = c.r;
    colorValues[ptr * 4 + 1] = c.g;
    colorValues[ptr * 4 + 2] = c.b;
  }

  instancedGeometry.positions.update(OBJECTS);
  //instancedGeometry.quaternions.update(OBJECTS);
  instancedGeometry.scales.update(OBJECTS);
  instancedGeometry.colors.update(OBJECTS);

  //group.rotation.y = t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };