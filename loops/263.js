import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import perlin from '../third_party/perlin.js';

import { vs as candyVertexShader } from './263/candy-vs.js';
import { fs as candyFragmentShader } from './263/candy-fs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as finalFragmentShader } from './263/final-fs.js';
import { fs as finalColorFragmentShader } from './263/final-color-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();
const pivot = new THREE.Group();

const loader = new THREE.TextureLoader();
const envTexture = loader.load('./loops/263/envmap.jpg');
const nTexture = loader.load('./loops/263/normal.png');
envTexture.wrapS = envTexture.wrapT = THREE.RepeatWrapping;

const mesh = new THREE.Mesh(
  new THREE.IcosahedronBufferGeometry(1, 4),
  new THREE.RawShaderMaterial({
    uniforms: {
      normalMap: { value: nTexture },
      envMap: { value: envTexture },
      stickTexture: { value: null },
      resolution: { value: new THREE.Vector2() },
    },
    vertexShader: candyVertexShader,
    fragmentShader: candyFragmentShader
  })
);
const tmp = new THREE.Vector3();
const positions = mesh.geometry.attributes.position.array;
for (let j = 0; j < positions.length; j += 3) {
  const x = positions[j + 0];
  const y = positions[j + 1];
  const z = positions[j + 2];
  const s = 1;
  const n = perlin.perlin3(s * x, s * y, s * z);
  tmp.set(x, y, z).normalize().multiplyScalar(1 + .03 * n);
  positions[j + 0] = tmp.x;
  positions[j + 1] = tmp.y;
  positions[j + 2] = tmp.z;
}
mesh.castShadow = true;
group.add(mesh);

const stick = new THREE.Mesh(
  new THREE.CylinderBufferGeometry(.1, .1, 10, 36),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: .8,
  })
);
stick.position.y = -5;
stick.receiveShadow = true;
group.add(stick);
pivot.add(group);
pivot.rotation.x = 1;
scene.add(pivot);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);
  const stickFBO = getFBO(.1 * w, .1 * h);

  mesh.material.uniforms.stickTexture.value = stickFBO.texture;
  mesh.material.uniforms.resolution.value.set(w, h);

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
    renderer.setClearColor(0, 0);
    mesh.visible = false;
    renderer.render(scene, camera, stickFBO);
    mesh.visible = true;
    renderer.setClearColor(0xf98b15, 1);
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

camera.position.set(2.5, -1, -4);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0, 0); //0xf98b15, 1);
const fog = new THREE.FogExp2(0xf98b15, .05);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  group.rotation.y = t * Maf.TAU;
  scene.position.y = .2 * Math.sin(t * Maf.TAU);
  scene.rotation.y = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };