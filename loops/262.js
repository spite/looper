import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as combineFragmentShader } from './262/combine-fs.js';
import { fs as finalFragmentShader } from './262/final-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const SCALES = 30;
const KEYS = 7 * SCALES;
const OBJECTS = 2 * KEYS;
const geometry = new RoundedBoxGeometry(1, .15, .1, .01, 5);
geometry.applyMatrix(new THREE.Matrix4().makeTranslation(.5, 0, 0));
const positions = geometry.attributes
const material = getInstancedMeshStandardMaterial({ wireframe: !true, color: 0xffffff, metalness: 0, roughness: .2 }, { colors: true });
const depthMaterial = getInstancedDepthMaterial();
const instancedGeometry = new InstancedGeometry(geometry, { size: OBJECTS, colors: true });
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

let ptr = 0;
const tmp = new THREE.Vector3();
const m = new THREE.Matrix4();
const m3 = new THREE.Matrix4();
const m2 = new THREE.Matrix4();
const q = new THREE.Quaternion();
for (let k = 0; k < KEYS; k++) {
  scaleValues[ptr * 3 + 0] = 1;
  scaleValues[ptr * 3 + 1] = 1;
  scaleValues[ptr * 3 + 2] = 1;

  colorValues[ptr * 4 + 0] = 1;
  colorValues[ptr * 4 + 1] = 1;
  colorValues[ptr * 4 + 2] = 1;
  colorValues[ptr * 4 + 3] = 1;
  ptr++;
}
const bkeys = [];
for (let k = 0; k < KEYS; k++) {

  scaleValues[ptr * 3 + 0] = .5;
  scaleValues[ptr * 3 + 1] = .75;
  scaleValues[ptr * 3 + 2] = 2;

  if (k % 7 === 0 || k % 7 === 3) {
    scaleValues[ptr * 3 + 0] = .00000005;
    scaleValues[ptr * 3 + 1] = .00000005;
    scaleValues[ptr * 3 + 2] = .00000005;
  }

  colorValues[ptr * 4 + 0] = 0;
  colorValues[ptr * 4 + 1] = 0;
  colorValues[ptr * 4 + 2] = 0;
  colorValues[ptr * 4 + 3] = 1;
  ptr++;

}

instancedGeometry.update(OBJECTS);

scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);

  const combineShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: colorFBO.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: combineFragmentShader,
  });
  const combinePass = new ShaderPass(renderer, combineShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: .5 },
      vignetteReduction: { value: .5 },
      inputTexture: { value: combinePass.fbo.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: finalFragmentShader,
  });
  const finalPass = new ShaderPass(renderer, finalShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera, t) {
    renderer.render(scene, camera, colorFBO);
    combinePass.render();
    finalPass.render(true);
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

camera.position.set(8.3, 1.5, 10);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x776E88, 1);
//scene.fog = new THREE.FogExp2(0x776E88, .3);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
let buffer = 0;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  let ptr = 0;
  const rot = 4;
  const rot2 = 4;
  const circ = t * Maf.TAU;
  for (let k = 0; k < KEYS; k++) {
    const f = k / KEYS;
    const rr = 3;
    const ra = f * Maf.TAU + .1;
    const rb = ra;
    const ry = 0;
    const rx = rr * Math.cos(ra);
    const rz = rr * Math.sin(ra);
    m.makeRotationY(-ra);

    const r2 = .5;
    const a2 = rot * f * Maf.TAU + circ;
    const x2 = r2 * Math.cos(a2);
    const y2 = r2 * Math.sin(a2);
    const z2 = .5 * Math.sin(rot2 * f * Maf.TAU + circ);

    tmp.set(x2, y2, z2);
    tmp.applyMatrix4(m);
    posValues[ptr * 3 + 0] = rx + tmp.x;
    posValues[ptr * 3 + 1] = ry + tmp.y;
    posValues[ptr * 3 + 2] = rz + tmp.z;

    m2.makeRotationZ(a2);
    m.multiply(m2);
    m2.makeRotationX(-a2);
    m.multiply(m2);
    q.setFromRotationMatrix(m);
    quatValues[ptr * 4 + 0] = q.x;
    quatValues[ptr * 4 + 1] = q.y;
    quatValues[ptr * 4 + 2] = q.z;
    quatValues[ptr * 4 + 3] = q.w;
    ptr++;
  }
  for (let k = 0; k < KEYS; k++) {
    const f = k / KEYS;
    const rr = 3;
    const ra = f * Maf.TAU + .025;
    const rb = ra;
    const ry = 0;
    const rx = rr * Math.cos(ra);
    const rz = rr * Math.sin(ra);
    m.makeRotationY(-ra);

    const r2 = .5;
    const a2 = rot * f * Maf.TAU + 1 * Maf.TAU / KEYS + circ;
    const x2 = r2 * Math.cos(a2);
    const y2 = r2 * Math.sin(a2);
    const z2 = .5 * Math.sin(rot2 * f * Maf.TAU + circ);

    tmp.set(x2, y2, z2);
    tmp.applyMatrix4(m);
    posValues[ptr * 3 + 0] = rx + tmp.x;
    posValues[ptr * 3 + 1] = ry + tmp.y;
    posValues[ptr * 3 + 2] = rz + tmp.z;

    m2.makeRotationZ(a2);
    m.multiply(m2);
    m2.makeRotationX(-a2);
    m.multiply(m2);
    q.setFromRotationMatrix(m);
    quatValues[ptr * 4 + 0] = q.x;
    quatValues[ptr * 4 + 1] = q.y;
    quatValues[ptr * 4 + 2] = q.z;
    quatValues[ptr * 4 + 3] = q.w;
    ptr++;
  }
  instancedGeometry.positions.update(OBJECTS);
  instancedGeometry.quaternions.update(OBJECTS);

  //group.rotation.y = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };