import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { GLTFLoader } from '../third_party/THREE.GLTFLoader.js';
import { OBJLoader } from '../third_party/THREE.OBJLoader.js';

import { vs as backdropVertexShader } from './261/backdrop-vs.js';
import { fs as backdropFragmentShader } from './261/backdrop-fs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';
import ShaderPingPongPass from '../modules/shader-ping-pong-pass.js';

import { fs as blurFragmentShader } from './267/blur-fs.js';
import { fs as combineFragmentShader } from './267/combine-fs.js';
import { fs as finalFragmentShader } from './267/final-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const backdrop = new THREE.Mesh(
  new THREE.IcosahedronBufferGeometry(10, 4),
  new THREE.RawShaderMaterial({
    uniforms: {
      brightColor: { value: new THREE.Color(0xaac9b5) },
      darkColor: { value: new THREE.Color(0x006fb7) },
    },
    vertexShader: backdropVertexShader,
    fragmentShader: backdropFragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
  })
);
group.add(backdrop);

const hair = new THREE.Group();
const head = new THREE.Group();

const BUNS = 6;
const loader = new GLTFLoader();
// https://sketchfab.com/models/60d73062cce341e2baf68ac1fa293b27
loader.load('./loops/267/bun/scene.gltf', (res) => {
  let bun;
  res.scene.traverse(function(child) {
    if (child.isMesh) {
      bun = child;
    }
  });
  for (let j = 0; j < BUNS; j++) {
    const m = bun.clone();
    m.scale.setScalar(2);
    const r = 10;
    const a = j * Maf.TAU / BUNS;
    m.position.x = r * Math.cos(a);
    m.position.y = 0;
    m.position.z = r * Math.sin(a);
    m.rotation.y = -a + Maf.PI / 2;
    m.castShadow = m.receiveShadow = true;
    hair.add(m);
  }
  hair.rotation.x = .57;
  group.add(hair);
});
loader.load('./loops/267/LeePerry/scene.gltf', (res) => {
  res.scene.traverse(function(child) {
    if (child.isMesh) {
      const m = child.clone();
      m.castShadow = m.receiveShadow = true;
      m.material.metalness = 0;
      m.material.roughness = .5;
      head.add(m);
    }
  });
  head.position.x = -9;
  head.position.y = -8;
  head.position.z = 5;
  head.scale.setScalar(40);
  head.rotation.x = -Maf.PI / 2;
  group.add(head);
});
group.scale.setScalar(.3);
scene.add(group);

scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);
  const hairFBO = getFBO(w, h);

  const blurShader = new THREE.RawShaderMaterial({
    uniforms: {
      inputTexture: { value: hairFBO.texture },
      resolution: { value: new THREE.Vector2(w, h) },
      direction: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: blurFragmentShader,
  });
  const blurPass = new ShaderPingPongPass(renderer, blurShader, .5 * w, .5 * h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const combineShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: colorFBO.texture },
      blurTexture: { value: blurPass.fbo.texture },
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
    backdrop.visible = false;
    renderer.setClearColor(0, 0);
    hair.visible = false;
    head.visible = true;
    renderer.render(scene, camera, hairFBO);
    hair.visible = true;
    head.visible = false;
    renderer.autoClearDepth = false;
    renderer.render(scene, camera, hairFBO);
    renderer.autoClearDepth = true;
    hair.visible = true;
    head.visible = true;
    scene.overrideMaterial = null;
    renderer.setClearColor(0x202020, 1);
    backdrop.visible = true;
    renderer.render(scene, camera, colorFBO);

    let offset = 2;
    blurShader.uniforms.inputTexture.value = hairFBO.texture;
    for (let j = 0; j < 10; j++) {
      blurShader.uniforms.direction.value.set(offset, 0);
      blurPass.render();
      blurShader.uniforms.inputTexture.value = blurPass.fbos[blurPass.currentFBO];
      blurShader.uniforms.direction.value.set(0, offset);
      blurPass.render();
      blurShader.uniforms.inputTexture.value = blurPass.fbos[blurPass.currentFBO];
    }

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

camera.position.set(0, 1, 10);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0, 1);
//scene.fog = new THREE.FogExp2(0x776E88, .3);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  hair.rotation.y = t * Maf.TAU / BUNS;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };