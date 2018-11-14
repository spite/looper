import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { noise, ridgedTurbulence, turbulence, fbm } from '../modules/perlin-functions.js';
import { sphericalToCartesian } from '../modules/conversions.js';

import { fs as hairFragmentShader } from './248/hair-fs.js';
import { vs as hairVertexShader } from './248/hair-vs.js';
import { fs as combineFragmentShader } from './248/combine-fs.js';
import { fs as finalFragmentShader } from './248/final-fs.js';
import { fs as finalColorFragmentShader } from './248/final-color-fs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const perlinCanvas = document.createElement('canvas');
const perlinCtx = perlinCanvas.getContext('2d');
perlinCanvas.width = 512;
perlinCanvas.height = 256;
const imageData = perlinCtx.getImageData(0, 0, perlinCanvas.width, perlinCanvas.height);
const data = imageData.data;
let ptr = 0;
for (let y = 0; y < perlinCanvas.height; y++) {
  for (let x = 0; x < perlinCanvas.width; x++) {
    const phi = x * Maf.TAU / perlinCanvas.width;
    const theta = y * Maf.PI / perlinCanvas.height;
    const p = sphericalToCartesian(1, theta, phi);
    const s = .0025;
    const t = turbulence(s * p.x, s * p.y, s * p.z);
    const s2 = 100;
    const f = fbm(s2 * p.x, s2 * p.y, s2 * p.z);
    const n = 255 * (.5 + .5 * (.75 * f + .25 * t));
    const s3 = 5;
    const c = 255 * (.5 + .5 * noise.perlin3(s3 * p.x, s3 * p.y, s3 * p.z));
    data[ptr + 0] = n;
    data[ptr + 1] = c;
    data[ptr + 2] = n;
    data[ptr + 3] = 255;
    ptr += 4;
  }
}
perlinCtx.putImageData(imageData, 0, 0);

const noiseTexture = new THREE.CanvasTexture(perlinCanvas);
const geometry = new THREE.IcosahedronBufferGeometry(1, 3);
const material = new THREE.RawShaderMaterial({
  uniforms: {
    noiseTexture: { value: noiseTexture },
    level: { value: 0 }
  },
  vertexShader: hairVertexShader,
  fragmentShader: hairFragmentShader,
  wireframe: !true,
  transparent: true,
  side: THREE.DoubleSide,
});
const LEVELS = 120;
const meshes = [];
const layers = new THREE.Group();
for (let j = 0; j < LEVELS; j++) {
  const mesh = new THREE.Mesh(geometry, material.clone());
  mesh.renderOrder = j;
  mesh.material.uniforms.noiseTexture.value = noiseTexture;
  mesh.material.uniforms.level.value = j / LEVELS;
  mesh.scale.setScalar(1 + 1 * j / LEVELS);
  layers.add(mesh);
  mesh.rotation.x = 0 * .08 * j / LEVELS;
  mesh.rotation.y = 0 * .1 * j / LEVELS;
  mesh.rotation.z = 0 * .09 * j / LEVELS;
  meshes.push(mesh);
}
group.add(layers);
scene.add(group);

const litSphere = new THREE.Mesh(
  new THREE.IcosahedronBufferGeometry(2, 4),
  new THREE.MeshStandardMaterial({ color: 0x808080, roughness: .9, metalness: 0 })
);
scene.add(litSphere);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);
  const shadeFBO = getFBO(w, h);

  const combineShader = new THREE.RawShaderMaterial({
    uniforms: {
      colorTexture: { value: colorFBO.texture },
      shadeTexture: { value: shadeFBO.texture },
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
    renderer.setClearColor(0, 0);
    litSphere.visible = false;
    layers.visible = true;
    renderer.render(scene, camera, colorFBO);

    renderer.setClearColor(0, 0);
    litSphere.visible = true;
    layers.visible = false;
    renderer.render(scene, camera, shadeFBO);

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

camera.position.set(5, 3, 6);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x776E88, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  const amplitude = 20;
  const a = easings.Linear(t) * Maf.TAU;
  const a2 = easings.InOutQuad(t) * Maf.TAU;
  const stiffness = .75 + .25 * Math.cos(2 * a);
  meshes.forEach((m, id) => {
    m.rotation.y = a2 - stiffness * id / meshes.length;
    m.rotation.x = a2 - stiffness * id / meshes.length;
  });
  group.rotation.y = a;
  group.rotation.x = a;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };