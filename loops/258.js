import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as cmykFragmentShader } from './258/cmyk-fs.js';
import { fs as finalFragmentShader } from './258/final-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const torus = new THREE.Mesh(
  new THREE.TorusBufferGeometry(3, .5, 200, 36),
  new THREE.MeshStandardMaterial({
    color: 0xff8a00,
    roughness: .4,
    metalness: 0
  })
);
torus.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(.1 * Maf.PI));
torus.castShadow = torus.receiveShadow = true;
group.add(torus);
const t2 = torus.clone();
t2.rotation.y = Maf.TAU / 3;
group.add(t2);
const t3 = torus.clone();
t3.rotation.y = 2 * Maf.TAU / 3;
group.add(t3);

scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);

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

  const cmykShader = new THREE.RawShaderMaterial({
    uniforms: {
      inputTexture: { value: finalPass.fbo.texture },
      resolution: { value: new THREE.Vector2(w, h) },
      time: { value: 1 },
      frequency: { value: 1 },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: cmykFragmentShader,
  });
  const cmykPass = new ShaderPass(renderer, cmykShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera, t) {
    renderer.render(scene, camera, colorFBO);
    finalPass.render();
    cmykShader.uniforms.time.value = t;
    cmykPass.render(true);
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

camera.position.set(10, 5, 10);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x00b9ff, 1);
scene.fog = new THREE.FogExp2(0x776E88, .04);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

const persistence = .001;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  group.rotation.y = t * Maf.TAU / 3;

  post.render(scene, camera, t * Maf.TAU);
}

export { renderer, draw, loopDuration, canvas };