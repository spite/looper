import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { GLTFLoader } from '../third_party/THREE.GLTFLoader.js';
import pointsOnSphere from '../modules/points-sphere.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as glitchFragmentShader } from './268/glitch-fs.js';
import { fs as finalFragmentShader } from './268/final-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const sphere = new THREE.Group();
const SPEAKERS = 30;
const points = pointsOnSphere(SPEAKERS);
const loader = new GLTFLoader();
const tmp = new THREE.Vector3();
const speakers = [];
let center;
// https://sketchfab.com/models/0c18345a29884719b0168291000e9f7c
loader.load('./loops/268/scene.gltf', (res) => {
  let speaker;
  res.scene.traverse(function(child) {
    if (child.isMesh) {
      speaker = child;
      speaker.material.color.setRGB(1, 1, 1);
      speaker.geometry.center();
      speaker.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Maf.PI / 4));
      speaker.geometry.applyMatrix(new THREE.Matrix4().makeRotationZ(Maf.PI));
      speaker.geometry.applyMatrix(new THREE.Matrix4().makeScale(.05, .05, .05));
    }
  });
  for (let j = 0; j < SPEAKERS; j++) {
    const m = speaker.clone();
    tmp.set(points[j].x, points[j].y, points[j].z);
    m.position.copy(tmp).multiplyScalar(3);
    m.castShadow = m.receiveShadow = true;
    m.lookAt(group.position);
    sphere.add(m);
    speakers.push({
      mesh: m,
      position: tmp.clone(),
      frequency: ~~Maf.randomInRange(8, 16)
    });
  }
  group.add(sphere);

  center = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3, 4),
    speaker.material.clone()
  );
  center.castShadow = center.receiveShadow = true;
  group.add(center);
});

scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);

  const glitchShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: colorFBO.texture },
      time: { value: 0 }
    },
    vertexShader: orthoVertexShader,
    fragmentShader: glitchFragmentShader,
  });
  const glitchPass = new ShaderPass(renderer, glitchShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: .5 },
      vignetteReduction: { value: .75 },
      inputTexture: { value: glitchPass.fbo.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: finalFragmentShader,
  });
  const finalPass = new ShaderPass(renderer, finalShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera, t) {
    glitchShader.uniforms.time.value = t;
    renderer.render(scene, camera, colorFBO);
    glitchPass.render();
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

camera.position.set(-3.8, 10.6, -8.22);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x776E88, 1);
scene.fog = new THREE.FogExp2(0x776E88, .05);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  speakers.forEach((s, i) => {
    const f = Maf.map(-1, 1, 0, 1, Math.sin(s.frequency * t * Maf.TAU + 3 * i * Maf.TAU / SPEAKERS));
    s.mesh.scale.setScalar(.75 + .25 * easings.InOutBounce(f));
    tmp.copy(s.position);
    tmp.multiplyScalar(3 + .5 * easings.InOutBounce(f));
    s.mesh.position.copy(tmp);
  });

  const f = Maf.map(-1, 1, 0, 1, Math.sin(10 * t * Maf.TAU));
  group.scale.setScalar(.75 + .25 * f);

  post.render(scene, camera, t);
}

export { renderer, draw, loopDuration, canvas };
