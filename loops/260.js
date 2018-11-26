import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { OBJLoader } from '../third_party/THREE.OBJLoader.js';

import { vs as sockVertexShader } from './260/sock-vs.js';
import { fs as sockFragmentShader } from './260/sock-fs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as finalFragmentShader } from './260/final-fs.js';
import { fs as finalColorFragmentShader } from './260/final-color-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const colors = [
  new THREE.Color(184., 25., 54.),
  new THREE.Color(37., 83., 130.),
  new THREE.Color(221., 43., 12.),
  new THREE.Color(65., 29., 68.),
  new THREE.Color(255., 121., 43.),
  new THREE.Color(198., 29., 6.),
];

const size = colors.length;
const data = new Uint8Array(3 * size);
for (let i = 0; i < size; i++) {
  const c = colors[i];
  data[i * 3 + 0] = c.r;
  data[i * 3 + 1] = c.g;
  data[i * 3 + 2] = c.b;
}

const texture = new THREE.DataTexture(data, colors.length, 1, THREE.RGBFormat);
texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
texture.needsUpdate = true;

const shadeMat = new THREE.MeshStandardMaterial({
  side: THREE.DoubleSide,
  roughness: .8,
  metalness: 0
});
const colorMat = new THREE.RawShaderMaterial({
  uniforms: {
    gradient: { value: texture }
  },
  vertexShader: sockVertexShader,
  fragmentShader: sockFragmentShader,
  side: THREE.DoubleSide
});

const NUM = 24;
let socks = [];
const loader = new OBJLoader();
loader.load('./loops/260/sock.obj', (res) => {
  const sockGeometry = res.children[0].geometry;
  sockGeometry.center();
  sockGeometry.computeVertexNormals();
  for (let j = 0; j < NUM; j++) {
    const mesh = new THREE.Mesh(sockGeometry, colorMat);
    mesh.castShadow = mesh.receiveShadow = true;
    const r = .5;
    const a = j * Maf.TAU / NUM;
    const x = r * Math.cos(a);
    const y = 0;
    const z = r * Math.sin(a);
    const pivot = new THREE.Group();
    const pivot2 = new THREE.Group();
    pivot.add(pivot2);
    mesh.position.y = -.1;
    mesh.position.z = .075;
    group.add(pivot);
    pivot.position.set(x, y, z);
    pivot.rotation.y = -a + Maf.PI / 2;
    pivot2.add(mesh);
    socks.push({
      pivot,
      pivot2,
      mesh
    })
  }
});

group.scale.setScalar(6);
scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);
  const shadeFBO = getFBO(w, h);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: .5 },
      vignetteReduction: { value: .5 },
      inputTexture: { value: colorFBO.texture },
      shadeTexture: { value: shadeFBO.texture },
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
    socks.forEach((s) => {
      s.mesh.material = colorMat;
    });
    renderer.render(scene, camera, colorFBO);
    socks.forEach((s) => {
      s.mesh.material = shadeMat;
    });
    renderer.render(scene, camera, shadeFBO);
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

camera.position.set(8, 5, 10);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x776E88, 1);
//scene.fog = new THREE.FogExp2(0x776E88, .3);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  socks.forEach((sock, i) => {
    sock.pivot2.position.y = -.1 + .2 * easings.OutQuint(.5 + .5 * Math.cos(1 * t * Maf.PI + 1 * i * Maf.TAU / socks.length));
    sock.pivot2.rotation.x = .5 - 2 * easings.InOutQuint(.5 + .5 * Math.sin(1 * t * Maf.PI + 1 * i * Maf.TAU / socks.length));
    sock.mesh.rotation.y = .4 - .8 * easings.Linear(.5 + .5 * Math.sin(2 * t * Maf.PI + 2 * i * Maf.TAU / socks.length));
  });
  group.rotation.y = t * Maf.PI;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };