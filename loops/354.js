import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
import { Post } from './354/post.js';

import { vs as boxVertexShader } from './354/box-vs.js';
import { fs as boxFragmentShader } from './354/box-fs.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(0, 0, 1);
camera.lookAt(group.position);
renderer.setClearColor(0, 1);

// Codevember - Contrast

const d = 20;

const loader = new THREE.TextureLoader();

const geometry = new RoundedBoxGeometry(.1, .1, .1, .01, 4);
const material = new THREE.RawShaderMaterial({
  uniforms: {
    matCap: { value: loader.load('../../assets/matcap3.jpg') },
    d: { value: d }
  },
  vertexShader: boxVertexShader,
  fragmentShader: boxFragmentShader,
});
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

const data = [];
for (let i = 0; i < OBJECTS; i++) {
  data[i] = {
    zOffset: Maf.randomInRange(-d, d),
    r: Maf.randomInRange(1, 3),
    angle: Maf.randomInRange(0, Maf.TAU),
    offsetRot: Maf.randomInRange(0, Maf.TAU),
    scale: Maf.randomInRange(.1, 4),
    rotation: Maf.randomInRange(0, Maf.TAU),
    speed: 1, //Maf.randomInRange(.5, 2)
    rotationSpeed: Maf.randomInRange(1, 3),
    c: Math.round(Maf.randomInRange(0, 1)),
    matrix: new THREE.Matrix4(),
  }
}

const tmp = new THREE.Vector3(0, 0, 0);
const up = new THREE.Vector3(0, 1, 0);
const center = new THREE.Vector3();

let ptr = 0;
for (let j = 0; j < OBJECTS; j++) {
  const x = Maf.randomInRange(-1, 1);
  const y = Maf.randomInRange(-1, 1);
  const z = Maf.randomInRange(-d, d);
  posValues[ptr * 3] = x;
  posValues[ptr * 3 + 1] = y;
  posValues[ptr * 3 + 2] = z;
  scaleValues[ptr * 3] = data[j].scale;
  scaleValues[ptr * 3 + 1] = data[j].scale;
  scaleValues[ptr * 3 + 2] = data[j].scale;
  quatValues[ptr * 4] = 0;
  quatValues[ptr * 4 + 1] = 0;
  quatValues[ptr * 4 + 2] = 0;
  quatValues[ptr * 4 + 3] = 1;
  colorValues[ptr * 4] = data[j].c;
  colorValues[ptr * 4 + 1] = data[j].c;
  colorValues[ptr * 4 + 2] = data[j].c;
  colorValues[ptr * 4 + 3] = 1;

  tmp.set(x, y, z);
  center.set(0, 0, z);
  data[j].matrix.lookAt(tmp, center, up);

  ptr++;
}

instancedGeometry.update(OBJECTS);

group.scale.setScalar(1);

scene.add(group);

const loopDuration = 5;

const mRot = new THREE.Matrix4();
const q = new THREE.Quaternion();
const m = new THREE.Matrix4();

const post = new Post(renderer);

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  let ptr = 0;
  for (let j = 0; j < OBJECTS; j++) {
    const a = data[j].angle + 0 * t * Maf.TAU * data[j].speed;
    const x = data[j].r * Math.cos(a);
    const y = data[j].r * Math.sin(a);
    let z = data[j].zOffset + t * 2 * d;
    if (z > d) z -= 2 * d;
    posValues[ptr * 3] = x;
    posValues[ptr * 3 + 1] = y;
    posValues[ptr * 3 + 2] = z; // - 5;

    m.copy(data[j].matrix);
    mRot.makeRotationX(data[j].offsetRot);
    m.multiply(mRot);
    mRot.makeRotationY(t * Maf.TAU * data[j].rotationSpeed);
    m.multiply(mRot);
    mRot.makeRotationX(t * Maf.TAU);
    m.multiply(mRot);
    q.setFromRotationMatrix(m);

    quatValues[ptr * 4 + 0] = q.x;
    quatValues[ptr * 4 + 1] = q.y;
    quatValues[ptr * 4 + 2] = q.z;
    quatValues[ptr * 4 + 3] = q.w;

    ptr++;
  }

  instancedGeometry.positions.update(OBJECTS);
  instancedGeometry.quaternions.update(OBJECTS);

  post.render(scene, camera);
}

export { draw, loopDuration, canvas, renderer, camera };