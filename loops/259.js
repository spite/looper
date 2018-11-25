import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as finalFragmentShader } from './259/final-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();
const group1 = new THREE.Group();
const group2 = new THREE.Group();

const eggGeometry = new THREE.IcosahedronBufferGeometry(1, 3);
const eggMaterial = new THREE.MeshStandardMaterial({
  roughness: .7,
  metalness: 0,
  color: 0xe56a4d,
  side: THREE.DoubleSide,
});
const egg = new THREE.Mesh(eggGeometry, eggMaterial);
const positions = egg.geometry.attributes.position.array;
for (let i = 0; i < positions.length; i += 3) {
  const x = positions[i + 0];
  const y = positions[i + 1];
  const z = positions[i + 2];
  const my = 4. * Math.exp(.5 * y - .5);
  positions[i + 1] = my;
}
egg.geometry.center();
egg.geometry.computeFaceNormals();
const raycast = new THREE.Raycaster();
const SLICES = 6;

const slices = [];

const h = egg.geometry.boundingBox.max.y - egg.geometry.boundingBox.min.y;
const sliceH = h / SLICES;
for (let j = 0; j < SLICES; j++) {
  const sliceGeo = new THREE.CylinderBufferGeometry(1.5, 1.5, sliceH, 72, 10, true);
  const m = new THREE.Matrix4().makeTranslation(0, .5 * sliceH + egg.geometry.boundingBox.min.y + j * sliceH, 0);
  sliceGeo.applyMatrix(m);
  const positions = sliceGeo.attributes.position.array;
  const normals = sliceGeo.attributes.normal.array;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i + 0];
    const y = positions[i + 1];
    const z = positions[i + 2];
    raycast.ray.origin.set(x, y, z);
    raycast.ray.direction.set(-x, 0, -z).normalize();
    const intersects = raycast.intersectObject(egg);
    if (intersects.length) {
      const p = intersects[0].point;
      positions[i + 0] = p.x;
      positions[i + 1] = p.y;
      positions[i + 2] = p.z;
      const n = intersects[0].face.normal;
      normals[i + 0] = p.x;
      normals[i + 1] = p.y;
      normals[i + 2] = p.z;
    } else {
      positions[i + 0] = 0;
      positions[i + 2] = 0;
      const t = new THREE.Vector3(positions[i + 0], positions[i + 1], positions[i + 2]).normalize();
      normals[i + 0] = t.x;
      normals[i + 1] = t.y;
      normals[i + 2] = t.z;
    }
  }
  const slice = new THREE.Mesh(sliceGeo, eggMaterial);
  group1.add(slice);
  slice.castShadow = slice.receiveShadow = true;
  slices.push(slice);
}

const w = egg.geometry.boundingBox.max.x - egg.geometry.boundingBox.min.x;
const sliceW = w / SLICES;
const slices2 = [];
for (let j = 0; j < SLICES; j++) {
  const sliceGeo = new THREE.CylinderBufferGeometry(1.5, 1.5, sliceW, 72, 10, true);
  const r = new THREE.Matrix4().makeRotationZ(.5 * Maf.PI);
  sliceGeo.applyMatrix(r);
  const m = new THREE.Matrix4().makeTranslation(.5 * sliceW + egg.geometry.boundingBox.min.x + j * sliceW, 0, 0);
  sliceGeo.applyMatrix(m);
  const positions = sliceGeo.attributes.position.array;
  const normals = sliceGeo.attributes.normal.array;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i + 0];
    const y = positions[i + 1];
    const z = positions[i + 2];
    raycast.ray.origin.set(x, y, z);
    raycast.ray.direction.set(0, -y, -z).normalize();
    const intersects = raycast.intersectObject(egg);
    if (intersects.length) {
      const p = intersects[0].point;
      positions[i + 0] = p.x;
      positions[i + 1] = p.y;
      positions[i + 2] = p.z;
      const n = intersects[0].face.normal;
      normals[i + 0] = p.x;
      normals[i + 1] = p.y;
      normals[i + 2] = p.z;
    } else {
      positions[i + 1] = -.25;
      positions[i + 2] = 0;
      const t = new THREE.Vector3(positions[i + 0], positions[i + 1], positions[i + 2]).normalize();
      normals[i + 0] = t.x;
      normals[i + 1] = t.y;
      normals[i + 2] = t.z;
    }
  }
  const slice = new THREE.Mesh(sliceGeo, eggMaterial);
  group2.add(slice);
  slice.castShadow = slice.receiveShadow = true;
  slices2.push(slice);
}
group.add(group1);
group.add(group2);
group.scale.setScalar(2);

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

  function render(scene, camera, t) {
    renderer.render(scene, camera, colorFBO);
    finalPass.render(true);
  }

  return {
    render
  }
}

const post = new Post(renderer);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-2, 2, 2);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = -1;
directionalLight.shadow.camera.far = 10;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
directionalLight2.shadow.camera.near = -4;
directionalLight2.shadow.camera.far = 10;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(0xe37785, 0xffc8c2, .5);
scene.add(light);

camera.position.set(7.5, -2, 9);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0xffc8c2, 1);
scene.fog = new THREE.FogExp2(0xffc8c2, .01);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  if (t < .5) {
    group1.visible = true;
    group2.visible = false;
    const t2 = t / .5;
    slices.forEach((slice, i) => {
      slice.position.x = Maf.parabola(easings.InOutQuad(t2), 1) * Math.sin(t2 * Maf.TAU + i * Maf.TAU / slices.length);
    });
    group.rotation.y = t2 * Maf.PI;
  } else {
    group1.visible = false;
    group2.visible = true;
    const t2 = (t - .5) / .5;
    slices2.forEach((slice, i) => {
      slice.position.y = Maf.parabola(easings.InOutQuad(t2), 1) * Math.sin(t2 * Maf.TAU + i * Maf.TAU / slices.length);
    });
    group.rotation.y = t2 * Maf.PI;
  }

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };