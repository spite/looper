import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';

import { fs as positionsFragmentShader } from './247/positions-fs.js';
import { vs as positionsVertexShader } from './247/positions-vs.js';
import { fs as waterFragmentShader } from './247/water-fs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';
import vignette from '../shaders/vignette.js';
import fxaa from '../shaders/fxaa.js';
import softLight from '../shaders/soft-light.js';
import colorDodge from '../shaders/color-dodge.js';
import rgbShift from '../shaders/rgb-shift.js';

const canvas = renderer.domElement;
const camera = getCamera();
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();
const pivot = new THREE.Group();

const prepassMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    showNormals: { value: 0 }
  },
  vertexShader: positionsVertexShader,
  fragmentShader: positionsFragmentShader,
  side: THREE.BackSide
})

const HEIGHT = .5;
const SIDES = 50;
const baseGeometry = new THREE.PlaneBufferGeometry(1, 1, SIDES, SIDES);
baseGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Maf.PI / 2));
baseGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, .5 * HEIGHT, 0));
const baseMaterial = prepassMaterial;
const loader = new THREE.TextureLoader();
const normalTexture = loader.load('./assets/WaterNormal.jpg');
const lightMaterial = new THREE.MeshStandardMaterial({
  color: 0x202020,
  metalness: .1,
  roughness: .35,
  normalMap: normalTexture,
  normalScale: new THREE.Vector2(.75, .75),
  wireframe: !true
});
const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
group.add(baseMesh);
baseMesh.castShadow = baseMesh.receiveShadow = true;

const bottomGeometry = new THREE.PlaneBufferGeometry(1, 1);
bottomGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(Maf.PI / 2));
bottomGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, -.5 * HEIGHT, 0));
const bottomMesh = new THREE.Mesh(bottomGeometry, baseMaterial);
group.add(bottomMesh);

function squareTurbulence(v) {
  return 1 - Math.pow(v, 2.);
}

function ridgedTurbulence(v) {
  return 1. - Math.abs(v);
}

function gaussianTurbulence(v) {
  return 1. - Math.exp(-Math.pow(v, 2));
}

function fbm(x, y, z) {
  let value = 0.;
  let amplitude = 1.;
  for (let i = 0; i < 8; i++) {
    value += amplitude * Math.abs(noise.perlin3(x, y, z));
    x *= 2.;
    y *= 2.;
    z *= 2.;
    amplitude *= .5;
  }
  return ridgedTurbulence(value);
}

function map(x, y, z, t) {
  const s1 = .5;
  const s2 = 1.5;
  const r = 1;
  return .1 * (fbm(s1 * x, s1 * y, s1 * z) + fbm(s2 * x, s2 * y, s2 * z));
}

function buildSide(dx, dz, a) {
  const sideGeometry = new THREE.PlaneBufferGeometry(1, HEIGHT, SIDES, 1);
  const sideMesh = new THREE.Mesh(sideGeometry, baseMaterial);
  const transMatrix = new THREE.Matrix4();
  transMatrix.makeTranslation(dx, 0, dz);
  const rotMatrix = new THREE.Matrix4();
  rotMatrix.makeRotationY(a);
  sideGeometry.applyMatrix(rotMatrix);
  sideGeometry.applyMatrix(transMatrix);
  group.add(sideMesh);
  return sideGeometry.attributes.position;
}

const sides = [
  buildSide(0, -.5, Maf.PI),
  buildSide(0, .5, 0),
  buildSide(.5, 0, Maf.PI / 2),
  buildSide(-.5, 0, -Maf.PI / 2),
]

pivot.add(group);
scene.add(pivot);

function updateVertices(t) {

  const pos = baseGeometry.attributes.position.array;

  for (let ptr = 0; ptr < pos.length; ptr += 3) {
    const x = pos[ptr + 0];
    const y = pos[ptr + 1];
    const z = pos[ptr + 2];
    pos[ptr + 1] = map(x, y, z, t);
  }
  baseGeometry.computeFaceNormals();
  baseGeometry.computeVertexNormals();
  baseGeometry.attributes.position.needsUpdate = true;

  for (let side of sides) {
    const positions = side.array;
    for (let j = 0; j < positions.length; j += 3) {
      const y = positions[j + 1];
      if (y > 0) {
        const x = positions[j];
        const z = positions[j + 2];
        positions[j + 1] = map(x, y, z, t);
      }
    }
    side.needsUpdate = true;
  }
}

const aberrationFragmentShader = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;

varying vec2 vUv;
${rgbShift}

void main() {
  vec4 color = rgbShift(inputTexture, vUv, vec2(30.));
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
${colorDodge}

void main() {
  vec4 color = fxaa(inputTexture, vUv);
  vec4 finalColor = softLight(color, vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.));
  gl_FragColor = finalColor;
}
`;

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const backFBO = getFBO(w, h, { type: THREE.HalfFloat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const frontFBO = getFBO(w, h, { type: THREE.HalfFloat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const normalsFBO = getFBO(w, h, { type: THREE.HalfFloat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const colorFBO = getFBO(w, h);

  const waterShader = new THREE.RawShaderMaterial({
    uniforms: {
      backTexture: { value: backFBO.texture },
      frontTexture: { value: frontFBO.texture },
      normalsTexture: { value: normalsFBO.texture },
      colorTexture: { value: colorFBO.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: waterFragmentShader,
  });
  const waterPass = new ShaderPass(renderer, waterShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: params.vignetteBoost || .5 },
      vignetteReduction: { value: params.vignetteReduction || .5 },
      inputTexture: { value: waterPass.fbo.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: finalFragmentShader,
  });
  const finalPass = new ShaderPass(renderer, finalShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const aberrationShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: finalPass.fbo.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: aberrationFragmentShader,
  });
  const aberrationPass = new ShaderPass(renderer, aberrationShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera) {
    renderer.setClearColor(0xff00ff, 0);
    baseMaterial.uniforms.showNormals.value = 0;
    baseMaterial.side = THREE.BackSide;
    renderer.render(scene, camera, backFBO);

    baseMaterial.side = THREE.FrontSide;
    renderer.render(scene, camera, frontFBO);

    baseMaterial.uniforms.showNormals.value = 1;
    renderer.render(scene, camera, normalsFBO);

    scene.overrideMaterial = lightMaterial;
    renderer.render(scene, camera, colorFBO);
    scene.overrideMaterial = null;

    waterPass.render();
    finalPass.render();
    aberrationPass.render(true);
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

camera.position.set(2, 2, -.77);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x776E88, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;
updateVertices();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  group.rotation.y = t * Maf.TAU;
  pivot.rotation.x = Math.cos(t * Maf.TAU) * Maf.TAU / 16 + Maf.TAU / 32;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };