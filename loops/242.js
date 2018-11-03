import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { getFBO } from '../modules/fbo.js';

import orthoVertexShader from '../shaders/ortho.js';
import vignette from '../shaders/vignette.js';
import fxaa from '../shaders/fxaa.js';
import softLight from '../shaders/soft-light.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as liquidFragmentShader } from './242/liquid-fs.js';
import { vs as liquidVertexShader } from './242/liquid-vs.js';

import { fs as glassFragmentShader } from './242/glass-fs.js';
import { vs as glassVertexShader } from './242/glass-vs.js';

const fragmentShader = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D backTexture;
uniform sampler2D frontTexture;
uniform float vignetteBoost;
uniform float vignetteReduction;

varying vec2 vUv;
${vignette}
${fxaa}
${softLight}

void main() {
  vec4 back = texture2D(backTexture, vUv);
  vec4 front = texture2D(frontTexture, vUv);
  vec4 color = mix(back,front,front.a);
  gl_FragColor = color;
}
`;

const finalFragmentShader = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform float vignetteBoost;
uniform float vignetteReduction;

varying vec2 vUv;
${vignette}
${fxaa}
${softLight}

void main() {
  vec4 color = fxaa(inputTexture, vUv);
  gl_FragColor = softLight(color, vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.));
}
`;

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const backgroundFBO = getFBO(w, h);
  const midgroundFBO = getFBO(w, h);
  const foregroundFBO = getFBO(w, h);

  const shader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: params.vignetteBoost || .5 },
      vignetteReduction: { value: params.vignetteReduction || .5 },
      backTexture: { value: backgroundFBO.texture },
      midTexture: { value: midgroundFBO.texture },
      frontTexture: { value: foregroundFBO.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: fragmentShader,
  });
  const combine = new ShaderPass(renderer, shader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: params.vignetteBoost || .5 },
      vignetteReduction: { value: params.vignetteReduction || .5 },
      inputTexture: { value: combine.fbo.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: finalFragmentShader,
  });
  const finalPass = new ShaderPass(renderer, finalShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera) {
    renderer.setClearColor(0x776E88, 1);
    field.visible = true;
    body.visible = false;
    liquidTop.visible = false;
    liquidBottom.visible = false;
    renderer.render(scene, camera, backgroundFBO);

    glassMaterial.uniforms.backTexture.value = backgroundFBO.texture;
    renderer.setClearColor(0, 0);
    body.visible = true;
    field.visible = false;
    body.material.side = THREE.BackSide;
    liquidTop.visible = true;
    liquidBottom.visible = true;
    renderer.render(scene, camera, midgroundFBO);

    glassMaterial.uniforms.backTexture.value = midgroundFBO.texture;
    renderer.setClearColor(0, 0);
    body.visible = true;
    field.visible = false;
    body.material.side = THREE.FrontSide;
    liquidTop.visible = false;
    liquidBottom.visible = false;
    renderer.render(scene, camera, foregroundFBO);

    combine.render();
    finalShader.uniforms.inputTexture.value = combine.fbo.texture;
    finalPass.render(true);
  }

  return {
    render
  }
}

const post = new Post(renderer);

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const sphereGeometry = new THREE.IcosahedronBufferGeometry(1, 3);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: .8, metalness: .1 });
const field = new THREE.Group();
for (let j = 0; j < 500; j++) {
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(Maf.randomInRange(-1, 1), Maf.randomInRange(-1, 1), Maf.randomInRange(-1, 1)).normalize().multiplyScalar(10);
  sphere.scale.setScalar(Maf.randomInRange(.1, .3));
  sphere.castShadow = sphere.receiveShadow;
  field.add(sphere);
}
group.add(field);

const clock = new THREE.Group();
const liquidMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    level: { value: 0 },
    time: { value: 0 },
    color: { value: new THREE.Color(237 - 10, 201 - 10, 175 - 10) },
    topColor: { value: new THREE.Color(237, 201, 175) }
  },
  vertexShader: liquidVertexShader,
  fragmentShader: liquidFragmentShader,
  side: THREE.DoubleSide
});
const thickness = .1;
const tmpVector = new THREE.Vector3();
const h = 2 - 2 * thickness;
const liquidTop = new THREE.Mesh(new THREE.CylinderBufferGeometry(1 - thickness, 1 - thickness, h, 72, 50), liquidMaterial);
let positions = liquidTop.geometry.attributes.position.array;
for (let p = 0; p < positions.length; p += 3) {
  tmpVector.set(positions[p], positions[p + 1] + 1 - thickness, positions[p + 2]);
  const d = Math.sqrt(tmpVector.x * tmpVector.x + tmpVector.z * tmpVector.z);
  const shape1 = Maf.parabola(Math.abs(tmpVector.y / (2 * h)), 1);
  const shape2 = Maf.clamp(Maf.parabola(Maf.mod(.5 * tmpVector.y, 1), .5), 0, 1);
  const factor = .1 + .5 * (shape1 + shape2);
  positions[p] = tmpVector.x * factor;
  positions[p + 2] = tmpVector.z * factor;
}
liquidTop.position.y = 1;
clock.add(liquidTop);

const liquidBottom = new THREE.Mesh(new THREE.CylinderBufferGeometry(1 - thickness, 1 - thickness, h, 72, 50), liquidMaterial.clone());
positions = liquidBottom.geometry.attributes.position.array;
for (let p = 0; p < positions.length; p += 3) {
  tmpVector.set(positions[p], positions[p + 1] - (1 - thickness), positions[p + 2]);
  const d = Math.sqrt(tmpVector.x * tmpVector.x + tmpVector.z * tmpVector.z);
  const shape1 = Maf.parabola(Math.abs(tmpVector.y / (2 * h)), 1);
  const shape2 = Maf.clamp(Maf.parabola(Maf.mod(.5 * tmpVector.y, 1), .5), 0, 1);
  const factor = .1 + .5 * (shape1 + shape2);
  positions[p] = tmpVector.x * factor;
  positions[p + 2] = tmpVector.z * factor;
}
liquidBottom.position.y = -1;
clock.add(liquidBottom);

const glassMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    backTexture: { value: null },
  },
  vertexShader: glassVertexShader,
  fragmentShader: glassFragmentShader,
  side: THREE.BackSide
});
const body = new THREE.Mesh(new THREE.CylinderBufferGeometry(1, 1, 4, 72, 100, !true), glassMaterial);
positions = body.geometry.attributes.position.array;
for (let p = 0; p < positions.length; p += 3) {
  tmpVector.set(positions[p], positions[p + 1], positions[p + 2]);
  const d = Math.sqrt(tmpVector.x * tmpVector.x + tmpVector.z * tmpVector.z);
  const shape1 = Maf.parabola(Math.abs(tmpVector.y / 4), 1);
  const shape2 = Maf.clamp(Maf.parabola(Maf.mod(.5 * tmpVector.y, 1), .5), 0, 1);
  const factor = .1 + .5 * (shape1 + shape2);
  positions[p] = tmpVector.x * factor;
  positions[p + 2] = tmpVector.z * factor;
}
clock.add(body);

group.add(clock);
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

camera.position.set(5, 3, 6);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x776E88, 1);
//scene.fog = new THREE.FogExp2(0x776E88, .3);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  clock.rotation.x = t * Maf.PI;
  const s = 4;
  const t2 = 1 - Maf.map(0, Math.exp(s), 0, 1, Math.exp(s * t));
  liquidTop.material.uniforms.level.value = 1 - 2 * t2;
  liquidTop.material.uniforms.time.value = t;
  liquidBottom.material.uniforms.level.value = -1 + 2 * t2;
  liquidBottom.material.uniforms.time.value = t;

  body.material.side = THREE.BackSide;
  field.rotation.y = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };