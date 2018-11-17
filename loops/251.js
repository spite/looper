import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import pointsOnSphere from '../modules/points-sphere.js';
import { gradientLinear } from '../modules/gradient.js';

import { vs as volumetricConeVertexShader } from './251/volumetric-cone-vs.js';
import { fs as volumetricConeFragmentShader } from './251/volumetric-cone-fs.js';
import { vs as volumetricSphereVertexShader } from './251/volumetric-glow-vs.js';
import { fs as volumetricSphereFragmentShader } from './251/volumetric-glow-fs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as finalFragmentShader } from './251/final-fs.js';
import { fs as finalColorFragmentShader } from './251/final-color-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const body = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(1, 3), new THREE.MeshBasicMaterial({ color: 0x000000 }));
group.add(body);

const gradient = new gradientLinear(["#e12a46", "#f6eb44", "#6feb69"]);

const coneGeometry = new THREE.CylinderBufferGeometry(.075, 1, 1, 72, 10, !true);
coneGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Maf.PI / 2));
coneGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0., .5));
//const coneMaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
const coneMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    color: { value: new THREE.Color() },
    maxDistance: { value: 1. },
    strength: { value: .5 },
    spread: { value: 6 }
  },
  vertexShader: volumetricConeVertexShader,
  fragmentShader: volumetricConeFragmentShader,
  side: THREE.DoubleSide,
  depthWrite: false,
  depthTest: true,
  transparent: true,
  blending: THREE.AdditiveBlending,
});

const glowGeometry = new THREE.IcosahedronBufferGeometry(.05, 3);
const glowMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    color: { value: new THREE.Color() },
    strength: { value: .25 },
    spread: { value: 8 }
  },
  vertexShader: volumetricSphereVertexShader,
  fragmentShader: volumetricSphereFragmentShader,
  side: THREE.FrontSide,
  depthWrite: false,
  depthTest: true,
  transparent: true,
  blending: THREE.AdditiveBlending,
});

function addLight(pos, dir, col) {
  const cone = new THREE.Mesh(coneGeometry, coneMaterial.clone());
  cone.material.uniforms.color.value.copy(col);
  cone.position.copy(pos);
  cone.scale.set(2, 2, 3);
  cone.lookAt(pos.add(dir));
  return cone;
}

function addGlow(pos, dir, col) {
  const glow = new THREE.Mesh(glowGeometry, glowMaterial.clone());
  glow.material.uniforms.color.value.copy(col);
  glow.position.copy(pos).multiplyScalar(.45);
  glow.lookAt(pos.add(dir));
  glow.scale.setScalar(18);
  return glow;
}
const lights = [];
const lightGeometry = new THREE.CylinderBufferGeometry(1, 1, .1, 72);
lightGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Maf.PI / 2));
const points = pointsOnSphere(30);
for (let point of points) {
  const color = gradient.getAt(Maf.randomInRange(0, 1));
  const dir = point.clone().normalize();
  const cone = addLight(point, dir, color);
  group.add(cone);
  const glow = addGlow(point, dir, color);
  group.add(glow);
  const mesh = new THREE.Mesh(lightGeometry, new THREE.MeshBasicMaterial({ color }));
  mesh.position.copy(cone.position);
  mesh.rotation.copy(cone.rotation);
  mesh.scale.setScalar(.15);
  group.add(mesh);
  lights.push({
    cone,
    glow,
    mesh,
    color,
    offset: Maf.randomInRange(0, 1),
    frequency: Math.floor(Maf.randomInRange(3, 6))
  });
}
scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: params.vignetteBoost || .5 },
      vignetteReduction: { value: params.vignetteReduction || .5 },
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

  function render(scene, camera) {
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

camera.position.set(5, 3, 6);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x150164, 1);
//scene.fog = new THREE.FogExp2(0x776E88, .3);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  let hsl = {};
  for (let light of lights) {
    const c = light.color;
    c.getHSL(hsl);
    const f = (.5 + .5 * Math.cos((easings.InOutQuad(Maf.mod(t + light.offset, 1))) * Maf.TAU * light.frequency));
    hsl.l = hsl.l * f;
    light.mesh.material.color.setHSL(hsl.h, hsl.s, hsl.l);
    light.glow.material.uniforms.color.value.setHSL(hsl.h, hsl.s, hsl.l);
    light.glow.material.uniforms.spread.value = 16 - 8 * f;
    light.cone.material.uniforms.color.value.setHSL(hsl.h, hsl.s, hsl.l);
    light.cone.material.uniforms.spread.value = 6 - 3 * f;
    light.cone.material.uniforms.strength.value = .5 * f;
    light.cone.material.uniforms.maxDistance.value = f;
  }

  group.rotation.x = t * Maf.TAU;
  group.rotation.y = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };