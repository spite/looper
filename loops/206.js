import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import { gradientLinear } from '../modules/gradient.js';
import easings from '../modules/easings.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.1 });

palette.range = ["#6B9AA0", "#F2C265", "#D84C14", "#7DC4CC", "#F6961C", "#6B9AA0"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(1, 1);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const gradient = new gradientLinear(palette.range);

const geometry = new THREE.BoxBufferGeometry(.75, .75, .75);
const material = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: .1, roughness: .4 }, { colors: true });
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

const data = [];
let ptr = 0;
const S = 6;
for (let y = -S; y <= S; y++) {
  for (let x = -S; x <= S; x++) {
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
    const d = Math.sqrt(x * x + y * y);
    const a = Math.atan2(y, x);
    data.push({ ptr, a, d, x: x, y: y })
    ptr++;
  }
}
let OBJECTS = ptr;

instancedGeometry.update(OBJECTS);

group.scale.setScalar(.1);
group.rotation.y = Maf.TAU / 8;

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

camera.position.set(0, 1, .33);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(palette.range[0], 1);
scene.fog = new THREE.FogExp2(palette.range[0], .5);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  data.forEach((e) => {

    const a = 2 * t * Maf.TAU + e.a;
    const r = .05 * e.d;

    const x = e.x + r * Maf.parabola((e.x / S + .5), 1) * Math.cos(a);
    const y = e.y + r * Maf.parabola((e.y / S + .5), 1) * Math.sin(a);

    let ptr = e.ptr;
    posValues[ptr * 3] = x;
    posValues[ptr * 3 + 1] = .1 * e.d;
    posValues[ptr * 3 + 2] = y;

    const f = .5 + .5 * Math.sin(t * Maf.TAU);
    const s = .5 + f * 1;
    scaleValues[ptr * 3 + 0] = s;
    scaleValues[ptr * 3 + 1] = s;
    scaleValues[ptr * 3 + 2] = s;

    const c = gradient.getAt(Maf.mod(.75 * t + e.a / Maf.TAU, 1));
    colorValues[ptr * 4 + 0] = c.r;
    colorValues[ptr * 4 + 1] = c.g;
    colorValues[ptr * 4 + 2] = c.b;

  });

  instancedGeometry.positions.update(OBJECTS);
  instancedGeometry.scales.update(OBJECTS);
  instancedGeometry.colors.update(OBJECTS);

  group.rotation.y = t * Maf.TAU / 4;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };