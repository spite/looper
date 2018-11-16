import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { noise, ridgedTurbulence, turbulence, fbm } from '../modules/perlin-functions.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';
import ShaderPingPongPass from '../modules/shader-ping-pong-pass.js';

import { fs as blurFragmentShader } from './249/blur-fs.js';
import { fs as combineFragmentShader } from './249/combine-fs.js';
import { fs as finalFragmentShader } from './249/final-fs.js';
import { fs as finalColorFragmentShader } from './249/final-color-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const texLoader = new THREE.TextureLoader();
const offset = 0; // Maf.randomInRange(-1, 1);

function distort(geometry) {
  const positions = geometry.attributes.position.array;
  const normals = geometry.attributes.normal.array;
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < positions.length; i += 3) {
    v.set(positions[i], positions[i + 1], positions[i + 2]);
    n.set(normals[i], normals[i + 1], normals[i + 2]);
    const s = .2;
    const f = .05 * noise.perlin3(s * v.x + offset, s * v.y + offset, s * v.z + offset);
    v.add(n.multiplyScalar(f));
    positions[i] = v.x;
    positions[i + 1] = v.y;
    positions[i + 2] = v.z;
  }
  geometry.computeVertexNormals();
  geometry.computeFaceNormals();
}

const geometry = new THREE.PlaneBufferGeometry(10, 10, 50, 50);
for (let j = 0; j < 100; j++) {
  distort(geometry);
}

// textures from https://withprop.artstation.com/projects/Y5d3w

const material = new THREE.MeshStandardMaterial({
  roughness: .5,
  metalness: 0,
  map: texLoader.load('./loops/249/diffuse.png'),
  normalMap: texLoader.load('./loops/249/normal.jpg'),
  roughnessMap: texLoader.load('./loops/249/roughness.jpg'),
  side: THREE.DoubleSide,
  transparent: true,
  alphaTest: .5,
});
const mesh = new THREE.Mesh(geometry, material);
mesh.castShadow = mesh.receiveShadow = true;
mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
  depthPacking: THREE.RGBADepthPacking,
  map: texLoader.load('./loops/249/diffuse.png'),
  alphaTest: 0.5
});

group.add(mesh);

const backdropGeometry = new THREE.IcosahedronBufferGeometry(50, 4);
const backdropMaterial = new THREE.MeshBasicMaterial({
  map: texLoader.load('./loops/249/bkg.jpg'),
  side: THREE.BackSide,
});
const backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
group.add(backdrop);

scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);
  const backFBO = getFBO(w, h);

  const blurShader = new THREE.RawShaderMaterial({
    uniforms: {
      inputTexture: { value: backFBO.texture },
      resolution: { value: new THREE.Vector2(w, h) },
      direction: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: blurFragmentShader,
  });
  const blurPass1 = new ShaderPingPongPass(renderer, blurShader, .5 * w, .5 * h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);
  const blurPass2 = new ShaderPingPongPass(renderer, blurShader, .25 * w, .25 * h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const combineShader = new THREE.RawShaderMaterial({
    uniforms: {
      colorTexture: { value: colorFBO.texture },
      blur1Texture: { value: blurPass1.fbo.texture },
      blur2Texture: { value: blurPass2.fbo.texture },
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
    mesh.visible = false;
    backdrop.visible = true;
    renderer.render(scene, camera, backFBO);

    renderer.setClearColor(0, 0);
    mesh.visible = true;
    backdrop.visible = false;
    renderer.render(scene, camera, colorFBO);

    let offset = 2;
    blurShader.uniforms.inputTexture.value = backFBO;
    for (let j = 0; j < 4; j++) {
      blurShader.uniforms.direction.value.set(offset, 0);
      blurPass1.render();
      blurShader.uniforms.inputTexture.value = blurPass1.fbos[blurPass1.currentFBO];
      blurShader.uniforms.direction.value.set(0, offset);
      blurPass1.render();
      blurShader.uniforms.inputTexture.value = blurPass1.fbos[blurPass1.currentFBO];
    }

    offset = 10;
    blurShader.uniforms.inputTexture.value = blurPass1.fbo;
    for (let j = 0; j < 20; j++) {
      blurShader.uniforms.direction.value.set(offset, 0);
      blurPass2.render();
      blurShader.uniforms.inputTexture.value = blurPass2.fbos[blurPass2.currentFBO];
      blurShader.uniforms.direction.value.set(0, offset);
      blurPass2.render();
      blurShader.uniforms.inputTexture.value = blurPass2.fbos[blurPass1.currentFBO];
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

camera.position.set(13, -4, -.25);
const target = new THREE.Vector3(0, 0, 0);
renderer.setClearColor(0, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  mesh.rotation.z = t * Maf.TAU;
  scene.rotation.y = t * Maf.TAU;
  scene.rotation.x = Math.sin(t * Maf.TAU) * Maf.TAU / 32.;

  const r = 1;
  target.x = r * Math.sin(t * Maf.TAU);
  target.y = r * Math.sin(2 * t * Maf.TAU);
  target.z = r * Math.cos(t * Maf.TAU);
  camera.lookAt(target);
  backdrop.position.copy(camera.position);

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };