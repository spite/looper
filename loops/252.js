import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { OBJLoader } from '../third_party/THREE.OBJLoader.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';
import ShaderPingPongPass from '../modules/shader-ping-pong-pass.js';

import { fs as blurFragmentShader } from './252/blur-fs.js';
import { fs as combineFragmentShader } from './252/combine-fs.js';
import { fs as finalFragmentShader } from './252/final-fs.js';
import { fs as finalColorFragmentShader } from './252/final-color-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const SLICES = 36;
let instancedGeometry;
const q = new THREE.Quaternion();
const m = new THREE.Matrix4();
const m2 = new THREE.Matrix4();
const m3 = new THREE.Matrix4();

const slices = [];
const loader = new OBJLoader();
const texLoader = new THREE.TextureLoader();
loader.load('./loops/252/Sliced_Bread_Loose_Slice.obj', (res) => {
  const slice = res.children[0];
  slice.geometry.applyMatrix(new THREE.Matrix4().makeScale(.1, .1, .1));
  slice.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Maf.PI / 2));
  const map = texLoader.load('./loops/252/diffuse.jpg');
  const normalMap = texLoader.load('./loops/252/normal.jpg');

  const material = getInstancedMeshStandardMaterial({
    roughness: 1.,
    metalness: 0.0001,
    color: 0xdedede,
    map,
    normalMap,
  }, { colors: false });
  const depthMaterial = getInstancedDepthMaterial();
  instancedGeometry = new InstancedGeometry(slice.geometry, { size: SLICES, hasUVs: true });
  const instancedMesh = new THREE.Mesh(instancedGeometry.geometry, material);
  instancedMesh.frustumCulled = false;
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;
  instancedMesh.customDepthMaterial = depthMaterial;
  group.add(instancedMesh);
});


function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);

  const blurShader = new THREE.RawShaderMaterial({
    uniforms: {
      inputTexture: { value: colorFBO.texture },
      resolution: { value: new THREE.Vector2(w, h) },
      direction: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: blurFragmentShader,
  });
  const blurPass = new ShaderPingPongPass(renderer, blurShader, .5 * w, .5 * h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const combineShader = new THREE.RawShaderMaterial({
    uniforms: {
      colorTexture: { value: colorFBO.texture },
      blurTexture: { value: blurPass.fbo.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: combineFragmentShader,
  });
  const combinePass = new ShaderPass(renderer, combineShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: params.vignetteBoost || .5 },
      vignetteReduction: { value: params.vignetteReduction || .5 },
      inputTexture: { value: combinePass.fbo.texture },
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

  function render(scene, camera) {
    renderer.render(scene, camera, colorFBO);

    let offset = 2;
    blurShader.uniforms.inputTexture.value = colorFBO;
    for (let j = 0; j < 4; j++) {
      blurShader.uniforms.direction.value.set(offset, 0);
      blurPass.render();
      blurShader.uniforms.inputTexture.value = blurPass.fbos[blurPass.currentFBO];
      blurShader.uniforms.direction.value.set(0, offset);
      blurPass.render();
      blurShader.uniforms.inputTexture.value = blurPass.fbos[blurPass.currentFBO];
    }

    combinePass.render();
    finalPass.render();
    finalColorPass.render(true);
  }

  return {
    render
  }
}

const post = new Post(renderer);

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

const light = new THREE.HemisphereLight(0x776E88, 0xffffff, .5);
scene.add(light);

camera.position.set(6.1, 3.6, 7.3);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 6;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  if (instancedGeometry) {
    const posValues = instancedGeometry.positions.values;
    const quatValues = instancedGeometry.quaternions.values;
    const scaleValues = instancedGeometry.scales.values;
    let ptr = 0;
    for (let j = 0; j < SLICES; j++) {
      const a = j * Maf.TAU / SLICES - t * Maf.TAU;
      const r = 2.5;
      const x = r * Math.cos(a);
      const y = .1 * Math.sin(4 * a + t * Maf.TAU);
      const z = r * Math.sin(a);
      posValues[ptr * 3] = x;
      posValues[ptr * 3 + 1] = y;
      posValues[ptr * 3 + 2] = z;
      scaleValues[ptr * 3] = 1;
      scaleValues[ptr * 3 + 1] = 1;
      scaleValues[ptr * 3 + 2] = 1;
      m3.makeRotationX(.25 * Math.sin(t * Maf.TAU + a));
      m2.makeRotationZ(a - 2 * t * Maf.TAU);
      m.makeRotationY(-a);
      m.multiply(m2);
      m.multiply(m3);
      q.setFromRotationMatrix(m);
      quatValues[ptr * 4] = q.x;
      quatValues[ptr * 4 + 1] = q.y;
      quatValues[ptr * 4 + 2] = q.z;
      quatValues[ptr * 4 + 3] = q.w;
      ptr++;
    }

    instancedGeometry.update(SLICES);
    group.rotation.x = t * Maf.TAU;

  }
  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };