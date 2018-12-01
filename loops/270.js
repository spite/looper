import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';

import { vs as screenVertexShader } from './270/screen-vs.js';
import { fs as screenFragmentShader } from './270/screen-fs.js';

import { createComputerScene } from './270/computer-scene.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';
import ShaderPingPongPass from '../modules/shader-ping-pong-pass.js';

import { fs as combineFragmentShader } from './270/combine-fs.js';
import { fs as finalFragmentShader } from './270/final-fs.js';
import { fs as blurFragmentShader } from './270/blur-fs.js';
import { fs as finalColorFragmentShader } from './270/final-color-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const computerScene = createComputerScene();
const screens = [];
const boxes = [];

const k = .05;
const kCube = -.05;
const screenGeometry = new THREE.BoxBufferGeometry(4, 3, 1, 50, 50);
const positions = screenGeometry.attributes.position.array;
for (let j = 0; j < positions.length; j += 3) {
  const x = positions[j + 0];
  const y = positions[j + 1];
  const z = positions[j + 2];
  const r = x * x + y * y;
  const f = 1. + r * (k + kCube * Math.sqrt(r));
  const taperX = .1 * easings.InOutQuad(Maf.parabola(Maf.map(-2, 2, 0, 1, x), .1));
  const taperY = .1 * easings.InOutQuad(Maf.parabola(Maf.map(-1.5, 1.5, 0, 1, y), .1));
  positions[j + 2] += f + Math.min(taperX, taperY);
}
screenGeometry.applyMatrix(new THREE.Matrix4().makeRotationY(Maf.PI));
screenGeometry.computeVertexNormals();
const screenMaterial = new THREE.MeshStandardMaterial({ color: 0, metalness: 1, roughness: .25, wireframe: !true });
const screen = new THREE.Mesh(screenGeometry, screenMaterial);

const boxGeometry = new RoundedBoxGeometry(4, 3, 2, .01, .01, 5);
const boxMaterial = new THREE.MeshStandardMaterial({ color: 0, roughness: .3, metalness: .1, wireframe: !true });
const box = new THREE.Mesh(boxGeometry, boxMaterial);
box.scale.setScalar(1.05);

const RINGS = 8;
const H = 30;
const MIN = -.5 * H;
const STEP = H / RINGS;
const SCREENS = 10;
for (let y = 0; y < RINGS; y++) {
  const aBase = y * Maf.TAU / RINGS;
  for (let o = 0; o < SCREENS; o++) {
    const r = 7;
    const a = o * Maf.TAU / SCREENS + aBase;
    const x = r * Math.cos(a);
    const z = r * Math.sin(a);
    const m = screen.clone();
    m.position.set(x, MIN + y * STEP, z);
    m.lookAt(0, MIN + y * STEP, 0);
    group.add(m);
    const b = box.clone();
    b.position.set(x, MIN + y * STEP, z);
    b.lookAt(0, MIN + y * STEP, 0);
    group.add(b);
    screens.push(m);
    boxes.push(b);
  }
}
scene.add(group);

const sceneMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    inputTexture: { value: null }
  },
  vertexShader: screenVertexShader,
  fragmentShader: screenFragmentShader
});
const blackMaterial = new THREE.MeshBasicMaterial({ color: 0 });

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);
  const screenFBO = getFBO(w, h);
  const sceneFBO = getFBO(400, 300);
  sceneMaterial.uniforms.inputTexture.value = sceneFBO.texture;

  const blurPasses = [];
  const levels = 5;
  const blurShader = new THREE.RawShaderMaterial({
    uniforms: {
      inputTexture: { value: null },
      resolution: { value: new THREE.Vector2(w, h) },
      direction: { value: new THREE.Vector2(0, 1) }
    },
    vertexShader: orthoVertexShader,
    fragmentShader: blurFragmentShader,
  });
  let tw = w;
  let th = h;
  for (let i = 0; i < levels; i++) {
    tw /= 2;
    th /= 2;
    tw = Math.round(tw);
    th = Math.round(th);
    const blurPass = new ShaderPingPongPass(renderer, blurShader, tw, th, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);
    blurPasses.push(blurPass);
  }

  const combineShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: colorFBO.texture },
      screenTexture: { value: screenFBO.texture },
      blur1Texture: { value: blurPasses[0].fbo.texture },
      blur2Texture: { value: blurPasses[1].fbo.texture },
      blur3Texture: { value: blurPasses[2].fbo.texture },
      blur4Texture: { value: blurPasses[3].fbo.texture },
      blur5Texture: { value: blurPasses[4].fbo.texture },
      time: { value: 0 }
    },
    vertexShader: orthoVertexShader,
    fragmentShader: combineFragmentShader,
  });
  const combinePass = new ShaderPass(renderer, combineShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: .5 },
      vignetteReduction: { value: .75 },
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

  function render(scene, camera, t) {
    renderer.render(computerScene.scene, computerScene.camera, sceneFBO);

    renderer.setClearColor(0x808080, 1);
    for (const screen of screens) {
      screen.material = screenMaterial;
    }
    for (const box of boxes) {
      box.material = boxMaterial;
    }
    renderer.render(scene, camera, colorFBO);

    renderer.setClearColor(0, 0);
    for (const screen of screens) {
      screen.material = sceneMaterial;
    }
    for (const box of boxes) {
      box.material = blackMaterial;
    }
    renderer.render(scene, camera, screenFBO);

    let offset = 8;
    blurShader.uniforms.inputTexture.value = screenFBO;
    for (let j = 0; j < levels; j++) {
      blurShader.uniforms.direction.value.set(offset, 0);
      const blurPass = blurPasses[j];
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

camera.position.set(18.5, -10.5, -5);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x776E88, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  group.position.y = -t * STEP;
  group.rotation.y = -t * (2 * Maf.TAU / SCREENS - Maf.TAU / RINGS);

  const l = 1;
  computerScene.landscape.position.z = t * l;
  computerScene.landscape2.position.z = l + t * l;
  computerScene.landscape3.position.z = 2 * l + t * l;
  //  computerScene.camera.position.y = .05 + .021 * Math.cos(t * Maf.TAU);
  //  computerScene.camera.position.z = .75 + .25 * Math.cos(t * Maf.TAU);
  post.render(scene, camera);
  //renderer.render(computerScene.scene, computerScene.camera);
}

export { renderer, draw, loopDuration, canvas };