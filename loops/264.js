import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import { OBJLoader } from '../third_party/THREE.OBJLoader.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as finalFragmentShader } from './264/final-fs.js';
import { fs as finalColorFragmentShader } from './264/final-color-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const loader = new OBJLoader();
loader.load('./loops/264/printer.obj', (res) => {
  const geometry = res.children[0].geometry;
  geometry.applyMatrix(new THREE.Matrix4().makeScale(.1, .1, .1));
  geometry.applyMatrix(new THREE.Matrix4().makeRotationY(Maf.PI / 2));
  init(geometry);
});

const OBJECTS = 20 + 16 + 10;
let posValues;
let quatValues;
let instancedGeometry;
let posValues2;
let quatValues2;
let instancedGeometry2;

function init(geometry) {

  const material = getInstancedMeshStandardMaterial({ side: THREE.DoubleSide, wireframe: !true, color: 0xaaaaaa, metalness: 0, roughness: .4 }, { colors: false });
  const depthMaterial = getInstancedDepthMaterial();
  instancedGeometry = new InstancedGeometry(geometry, { size: OBJECTS, colors: true });
  const instancedMesh = new THREE.Mesh(instancedGeometry.geometry, material);
  instancedMesh.frustumCulled = false;
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;
  instancedMesh.customDepthMaterial = depthMaterial;
  group.add(instancedMesh);

  posValues = instancedGeometry.positions.values;
  quatValues = instancedGeometry.quaternions.values;
  const scaleValues = instancedGeometry.scales.values;

  let ptr = 0;
  const tmp = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const m3 = new THREE.Matrix4();
  const m2 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let k = 0; k < OBJECTS; k++) {
    scaleValues[ptr * 3 + 0] = 1;
    scaleValues[ptr * 3 + 1] = 1;
    scaleValues[ptr * 3 + 2] = 1;
    ptr++;
  }

  instancedGeometry.update(OBJECTS);

  const material2 = getInstancedMeshStandardMaterial({ side: THREE.DoubleSide, wireframe: !true, color: 0xffffff, metalness: 0, roughness: .8 }, { colors: false });
  const depthMaterial2 = getInstancedDepthMaterial();
  instancedGeometry2 = new InstancedGeometry(new THREE.PlaneBufferGeometry(.21, .19), { size: OBJECTS, colors: true });
  instancedGeometry2.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Maf.PI / 2));
  instancedGeometry2.geometry.applyMatrix(new THREE.Matrix4().makeScale(.5, .5, .5));
  const instancedMesh2 = new THREE.Mesh(instancedGeometry2.geometry, material2);
  instancedMesh2.frustumCulled = false;
  instancedMesh2.castShadow = true;
  instancedMesh2.receiveShadow = true;
  instancedMesh2.customDepthMaterial = depthMaterial2;
  group.add(instancedMesh2);

  posValues2 = instancedGeometry2.positions.values;
  quatValues2 = instancedGeometry2.quaternions.values;
  const scaleValues2 = instancedGeometry2.scales.values;

  ptr = 0;
  for (let k = 0; k < OBJECTS; k++) {
    scaleValues2[ptr * 3 + 0] = 1;
    scaleValues2[ptr * 3 + 1] = 1;
    scaleValues2[ptr * 3 + 2] = 1;
    ptr++;
  }

  instancedGeometry2.update(OBJECTS);
}

group.scale.setScalar(3.5);
scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: .5 },
      vignetteReduction: { value: .5 },
      inputTexture: { value: colorFBO.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: finalFragmentShader,
  });
  const finalPass = new ShaderPass(renderer, finalShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const finalColorShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: finalPass.fbo.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: finalColorFragmentShader,
  });
  const finalColorPass = new ShaderPass(renderer, finalColorShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera, t) {
    renderer.setClearColor(0xf98b15, 1);
    renderer.render(scene, camera, colorFBO);
    finalPass.render();
    finalColorPass.render(true);
  }

  return {
    render
  }
}

const post = new Post(renderer);

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

const light = new THREE.HemisphereLight(0x776E88, 0xffffff, .5);
scene.add(light);

camera.position.set(7, 4.1, 8.3);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x776E88, 1);
scene.fog = new THREE.FogExp2(0x776E88, .03);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const m = new THREE.Matrix4();
const m2 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const tmp = new THREE.Vector3();

const loopDuration = 3.5;

function makeCircle(ptr, r, y, length, a, t) {
  for (let k = 0; k < length; k++) {
    const f = k / length;
    const ra = f * Maf.TAU + Maf.PI / 2;
    const rb = ra;
    const ry = y;
    const rx = r * Math.cos(ra);
    const rz = r * Math.sin(ra);

    posValues[ptr * 3 + 0] = rx;
    posValues[ptr * 3 + 1] = ry;
    posValues[ptr * 3 + 2] = rz;

    const d = 6;
    posValues2[ptr * 3 + 0] = (r + t * d) * Math.cos(ra);
    posValues2[ptr * 3 + 1] = ry - 10 * Math.pow(t - .1, 2);
    posValues2[ptr * 3 + 2] = (r + t * d) * Math.sin(ra);

    m.makeRotationY(-ra);
    m2.makeRotationZ(a - t * Maf.TAU);
    m.multiply(m2);
    q.setFromRotationMatrix(m);
    quatValues[ptr * 4 + 0] = q.x;
    quatValues[ptr * 4 + 1] = q.y;
    quatValues[ptr * 4 + 2] = q.z;
    quatValues[ptr * 4 + 3] = q.w;

    m.makeRotationY(-ra);
    m2.makeRotationZ(a - t * Maf.TAU - .1 * y * Maf.TAU);
    m.multiply(m2);
    q.setFromRotationMatrix(m);
    quatValues2[ptr * 4 + 0] = q.x;
    quatValues2[ptr * 4 + 1] = q.y;
    quatValues2[ptr * 4 + 2] = q.z;
    quatValues2[ptr * 4 + 3] = q.w;
    ptr++;
  }
  return ptr;
}

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  if (instancedGeometry) {
    let ptr = 0;
    ptr = makeCircle(ptr, 1, 0, 20, 0, t);
    ptr = makeCircle(ptr, .8, .3, 16, .5, Maf.mod(t + 1 / 5, 1));
    ptr = makeCircle(ptr, .5, .5, 10, 1, Maf.mod(t + 2 / 5, 1));
    instancedGeometry.positions.update(OBJECTS);
    instancedGeometry.quaternions.update(OBJECTS);
    instancedGeometry2.positions.update(OBJECTS);
    instancedGeometry2.quaternions.update(OBJECTS);
  }

  group.rotation.x = .25 * Maf.PI;
  group.rotation.y = t * Maf.TAU / 2;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };