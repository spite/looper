import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { createSprinkledFrostedDonut } from './269/sprinkled-frosted-donut.js';
import { EquirectangularToCubemap } from '../modules/equirectangular-to-cubemap.js';
import pointsOnSphere from '../modules/points-sphere.js';

import { vs as gradientVertexShader } from './269/gradient-vs.js';
import { fs as gradientFragmentShader } from './269/gradient-fs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as combineFragmentShader } from './269/combine-fs.js';
import { fs as finalFragmentShader } from './269/final-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const colors = [0x77381f, 0xfde0df, 0xffc470, 0x4c210e, 0xff4a91];

const donutMaterial = new THREE.MeshStandardMaterial({ color: 0xeb8820, metalness: 0, roughness: .6 })
const gradientMaterial = new THREE.RawShaderMaterial({
  vertexShader: gradientVertexShader,
  fragmentShader: gradientFragmentShader
});
const noFrostMaterial = new THREE.MeshStandardMaterial({ color: 0, metalness: 0, roughness: .6 })
const donuts = [];
const pivots = [];
const DONUTS = 10;
const frostingMaterials = [];
const points = pointsOnSphere(DONUTS);
for (let j = 0; j < DONUTS; j++) {
  const r = 5;
  const p = points[j];
  const pivot = new THREE.Group();
  const seed = Maf.randomInRange(0, 100);
  const amount = Maf.randomInRange(.5, 1);
  const frostingMaterial = new THREE.MeshStandardMaterial({ color: colors[~~Maf.randomInRange(0, colors.length)], metalness: .2, roughness: .4 });
  const donut = createSprinkledFrostedDonut(donutMaterial, frostingMaterial, seed, amount, 500);
  pivot.position.set(p.x, p.y, p.z).multiplyScalar(r);
  pivot.lookAt(group.position);
  donut.donut.group.scale.setScalar(.5);
  pivot.add(donut.donut.group);
  group.add(pivot);
  pivots.push(pivot);
  donut.donut.group.rotation.x = Maf.PI;
  donuts.push(donut);
  frostingMaterials.push(frostingMaterial);
}
group.scale.setScalar(.8);
scene.add(group);

const loader = new THREE.TextureLoader();
loader.load('./loops/263/envmap.jpg', function(res) {
  var equiToCube = new EquirectangularToCubemap(renderer);
  for (let frostingMaterial of frostingMaterials) {
    frostingMaterial.envMap = equiToCube.convert(res, 1024);
    frostingMaterial.envMapIntensity = .25;
    frostingMaterial.needsUpdate = true;
  }
});

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);
  const gradientFBO = getFBO(w, h);

  const combineShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: colorFBO.texture },
      gradientTexture: { value: gradientFBO.texture },
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

  function render(scene, camera, t) {
    for (const donut of donuts) {
      donut.donut.donut.material = gradientMaterial;
      donut.donut.frosting.material = noFrostMaterial;
      donut.instancedMesh.visible = false;
    }
    renderer.setClearColor(0, 0);
    renderer.render(scene, camera, gradientFBO);
    for (const donut of donuts) {
      donut.donut.donut.material = donut.donut.donutMaterial;
      donut.donut.frosting.material = donut.donut.frostingMaterial;
      donut.instancedMesh.visible = true;
    }
    renderer.setClearColor(0x9dc9ed, 1);
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

camera.position.set(0, 0, 15);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x9dc9ed, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  for (const pivot of pivots) {
    pivot.rotation.z = t * Maf.TAU;
  }

  group.rotation.y = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };