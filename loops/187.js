import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import { gradientLinear } from '../modules/gradient.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: .1 });

palette.range = ["#FD5222", "#E9A20E", "#45A9E5", "#FAF9F8", "#E0320B", "#CDCEC4", "#35A2D5", "#FD5222"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(4, 4);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const gradient = new gradientLinear(palette.range);

const LINES = 8;
const LOOPS = LINES * 8;
const OBJECTS = LOOPS * 8;

const geometry = new RoundedBoxGeometry(1.5, 3, 1, .1, 4);
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

instancedGeometry.update(OBJECTS);

group.scale.setScalar(2);

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

camera.position.set(1.6, 7, 7);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(palette.range[5], 1);
scene.fog = new THREE.FogExp2(palette.range[5], 0.065);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

const m = new THREE.Matrix4();
const center = new THREE.Vector3(0, 0, 0);
const up = new THREE.Vector3(0, 1, 0);
const q = new THREE.Quaternion();
const p = new THREE.Vector3();
const b = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;
  const t2 = Maf.mod(t + .5, 1);

  for (let ptr = 0; ptr < OBJECTS; ptr++) {

    const r = .45 + .05 * Math.cos(t * Maf.TAU);
    const a = ptr * Maf.TAU / OBJECTS;
    b.set(r * Math.cos(a), 0, r * Math.sin(a));
    const offset = ((ptr % LOOPS) % LINES) / LINES;
    const a2 = ((ptr % LOOPS) * Maf.TAU / LOOPS) + offset * Maf.TAU + ptr * Maf.TAU / OBJECTS + t * Maf.TAU / 7;
    const r2 = 2 * r;
    p.set(r2 * Math.cos(a2), r2 * Math.sin(a2), 0);
    p.applyAxisAngle(up, -a);
    p.add(b);

    posValues[ptr * 3 + 0] = p.x;
    posValues[ptr * 3 + 1] = p.y;
    posValues[ptr * 3 + 2] = p.z;

    m.lookAt(p, b, up);
    q.setFromRotationMatrix(m);
    quatValues[ptr * 4 + 0] = q.x;
    quatValues[ptr * 4 + 1] = q.y;
    quatValues[ptr * 4 + 2] = q.z;
    quatValues[ptr * 4 + 3] = q.w;

    const s = .1;
    scaleValues[ptr * 3 + 0] = s;
    scaleValues[ptr * 3 + 1] = s;
    scaleValues[ptr * 3 + 2] = s;

    const c = gradient.getAt(Maf.mod(a2 / Maf.TAU - .25, 1));
    colorValues[ptr * 4 + 0] = c.r;
    colorValues[ptr * 4 + 1] = c.g;
    colorValues[ptr * 4 + 2] = c.b;
  }

  instancedGeometry.positions.update(OBJECTS);
  instancedGeometry.quaternions.update(OBJECTS);
  //instancedGeometry.scales.update(OBJECTS);
  instancedGeometry.colors.update(OBJECTS);

  group.rotation.y = -t * .1;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };