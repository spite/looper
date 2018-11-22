import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { MarchingCubes } from '../third_party/THREE.MarchingCubes.js';
import perlin from '../third_party/perlin.js';

import { vs as coffeeVertexShader } from './254/coffee-vs.js';
import { fs as coffeeFragmentShader } from './254/coffee-fs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';
import ShaderPingPongPass from '../modules/shader-ping-pong-pass.js';

import { fs as combineFragmentShader } from './254/combine-fs.js';
import { fs as blurFragmentShader } from './254/blur-fs.js';
import { fs as highlightFragmentShader } from './254/highlight-fs.js';
import { fs as finalFragmentShader } from './254/final-fs.js';
import { fs as finalColorFragmentShader } from './254/final-color-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const loader = new THREE.TextureLoader();
const envTexture = loader.load('./loops/254/envmap.jpg');

const resolution = 100;
const material = new THREE.MeshBasicMaterial();
const effect = new MarchingCubes(resolution, material, true, false);
effect.position.set(0, 0, 0);
effect.isolation = 100;
effect.enableUvs = false;
effect.enableColors = false;
effect.init(resolution);

const box = new THREE.BoxBufferGeometry(1, 1, 1);
const mat = new THREE.MeshNormalMaterial();

const BLOBS = 3000;
const tmpVector = new THREE.Vector3();
const radius = .4;
let blobs = 0;
effect.reset();
const axis = new THREE.Vector3();
while (blobs < BLOBS) {
  for (let i = 0; i < 100; i++) {
    const offset = Maf.randomInRange(.25 * Maf.TAU, .5 * Maf.TAU);
    const max = Maf.randomInRange(.125 * Maf.TAU, .5 * Maf.TAU);
    let step = Maf.randomInRange(.005, .05);
    const phi = Maf.randomInRange(0, Maf.TAU);
    const oStrength = Maf.randomInRange(.005, .01);
    axis.set(Maf.randomInRange(-1, 1), Maf.randomInRange(-1, 1), Maf.randomInRange(-1, 1)).normalize();
    const angle = Maf.randomInRange(-.5, .5);
    const rot = Math.random() > .5 ? Maf.randomInRange(.001, .005) : Maf.randomInRange(.5, 1.);
    for (let a = offset; a < offset + max; a += step) {
      const theta = a;
      const subtract = Maf.randomInRange(2, 3);
      const r = radius;
      tmpVector.x = r * Math.sin(theta) * Math.cos(phi);
      tmpVector.y = r * Math.sin(theta) * Math.sin(phi);
      tmpVector.z = r * Math.cos(theta);
      tmpVector.applyAxisAngle(axis, angle + rot * a);
      const strength = oStrength * (.1 + .9 * (1. - Maf.parabola((a - offset) / max, 1)));
      effect.addBall(tmpVector.x + .5, tmpVector.y + .5, tmpVector.z + .5, strength, subtract);
      blobs++;
      step += Maf.randomInRange(0, .005 * strength);
    }
  }
}
const coffeeMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    max: { value: .5 },
    envTexture: { value: envTexture }
  },
  vertexShader: coffeeVertexShader,
  fragmentShader: coffeeFragmentShader,
  transparent: true,
});
const mesh = new THREE.Mesh(
  effect.generateBufferGeometry(),
  coffeeMaterial
);
mesh.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Maf.PI / 2));
mesh.scale.setScalar(6);
group.add(mesh);

const shadowMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: 1 })
const shadowMesh = new THREE.Mesh(
  mesh.geometry,
  shadowMaterial
);
shadowMesh.castShadow = shadowMesh.receiveShadow = true;
shadowMesh.scale.setScalar(6);
group.add(shadowMesh);

scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const shadeFBO = getFBO(w, h);
  const liquidFBO = getFBO(w, h);

  const highlightShader = new THREE.RawShaderMaterial({
    uniforms: {
      liquidTexture: { value: liquidFBO.texture },
      shadeTexture: { value: shadeFBO.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: highlightFragmentShader,
  });
  const highlightPass = new ShaderPass(renderer, highlightShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);


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
      liquidTexture: { value: liquidFBO.texture },
      shadeTexture: { value: shadeFBO.texture },
      blur1Texture: { value: blurPasses[0].fbo.texture },
      blur2Texture: { value: blurPasses[1].fbo.texture },
      blur3Texture: { value: blurPasses[2].fbo.texture },
      blur4Texture: { value: blurPasses[3].fbo.texture },
      blur5Texture: { value: blurPasses[4].fbo.texture },
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
    mesh.visible = true;
    renderer.render(scene, camera, liquidFBO);

    mesh.visible = false;
    shadowMesh.visible = true;
    renderer.render(scene, camera, shadeFBO);

    highlightPass.render();

    let v = 1;

    let offset = 4;
    blurShader.uniforms.inputTexture.value = highlightPass.fbo.texture;
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

camera.position.set(-14, -5, 10);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 5;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;
  scene.rotation.y = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };