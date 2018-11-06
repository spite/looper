import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import { sphericalToCartesian, cartesianToSpherical } from '../modules/conversions.js';
import { OBJLoader } from '../third_party/THREE.OBJLoader.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import vignette from '../shaders/vignette.js';
import fxaa from '../shaders/fxaa.js';
import rgbShift from '../shaders/rgb-shift.js';
import ShaderPass from '../modules/shader-pass.js';
import softLight from '../shaders/soft-light.js';
import colorDodge from '../shaders/color-dodge.js';

import { fs as shockwaveFragmentShader } from './245/shockwave-fs.js';
import { vs as shockwaveVertexShader } from './245/shockwave-vs.js';
import { fs as backdropFragmentShader } from './245/backdrop-fs.js';
import { vs as backdropVertexShader } from './245/backdrop-vs.js';

const canvas = renderer.domElement;
const camera = getCamera(35);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const backGeometry = new THREE.IcosahedronBufferGeometry(3, 4);
const backMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    brightColor: { value: new THREE.Color(255, 255, 255) },
    darkColor: { value: new THREE.Color(108, 22, 199) },
  },
  vertexShader: backdropVertexShader,
  fragmentShader: backdropFragmentShader,
  side: THREE.BackSide,
  depthWrite: false
});
const backdrop = new THREE.Mesh(backGeometry, backMaterial);
backdrop.rotation.z = .2;
scene.add(backdrop);

const POINTS = 1000;

const geometry = new THREE.BoxBufferGeometry(.01, .01, .01);
const material = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: .1, roughness: .8 }, { colors: !true });
const r = 3;

function generateParticles(from, to) {
  const instancedGeometry = new InstancedGeometry(geometry, { size: POINTS, colors: true });
  const instancedMesh = new THREE.Mesh(instancedGeometry.geometry, material);
  instancedMesh.frustumCulled = false;

  const posValues = instancedGeometry.positions.values;
  const quatValues = instancedGeometry.quaternions.values;
  const scaleValues = instancedGeometry.scales.values;

  for (let ptr = 0; ptr < POINTS; ptr++) {
    const x = Maf.randomInRange(-r, r);
    const y = Maf.randomInRange(-r, r);
    const z = Maf.randomInRange(from, to);
    posValues[ptr * 3] = x;
    posValues[ptr * 3 + 1] = y;
    posValues[ptr * 3 + 2] = z;
    scaleValues[ptr * 3] = 1;
    scaleValues[ptr * 3 + 1] = 1;
    scaleValues[ptr * 3 + 2] = 1;
    quatValues[ptr * 4] = 0;
    quatValues[ptr * 4 + 1] = 0;
    quatValues[ptr * 4 + 2] = 0;
    quatValues[ptr * 4 + 3] = 1;
  }

  instancedGeometry.update(POINTS);

  return { instancedMesh, instancedGeometry };
}

const particles = generateParticles(-r, r);
group.add(particles.instancedMesh);

scene.add(group);

// Model by Logan Lee https://sketchfab.com/loganlee0217
// https://sketchfab.com/models/277db5efa378494882aaa820abb84437

const loader = new OBJLoader();
let speaker = null;
loader.load('loops/245/Speaker.obj', (res) => {
  speaker = res.children[0];
  speaker.geometry.center();
  speaker.scale.setScalar(.1);
  group.add(speaker);
  const texLoader = new THREE.TextureLoader();
  speaker.material = new THREE.MeshStandardMaterial({
    map: texLoader.load('loops/245/test_DefaultMaterial_Diffuse.jpg'),
    roughnessMap: texLoader.load('loops/245/test_DefaultMaterial_Glossiness.jpg'),
    metalnessMap: texLoader.load('loops/245/test_DefaultMaterial_Glossiness.jpg'),
  });
  speaker.castShadow = speaker.receiveShadow = true;
});

const shockwaveMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    frequency: { value: 0 },
    time: { value: 0 }
  },
  vertexShader: shockwaveVertexShader,
  fragmentShader: shockwaveFragmentShader,
  wireframe: !true,
  side: THREE.DoubleSide,
});
const shockwavePlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(2.3, 2.3, 100, 100), shockwaveMaterial);
shockwavePlane.position.z = .32;
shockwavePlane.position.y = -.25;
group.add(shockwavePlane);

const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
directionalLight.position.set(-2, 2, 2);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = -1;
directionalLight.shadow.camera.far = 10;
directionalLight.shadow.camera.left = -.75;
directionalLight.shadow.camera.top = .75;
directionalLight.shadow.camera.right = .75;
directionalLight.shadow.camera.bottom = -.75;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
directionalLight2.shadow.camera.near = -4;
directionalLight2.shadow.camera.far = 10;
directionalLight2.shadow.camera.left = -.75;
directionalLight2.shadow.camera.top = .75;
directionalLight2.shadow.camera.right = .75;
directionalLight2.shadow.camera.bottom = -.75;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0xffffff, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(0x6c16c7, 0xffffff, .5);
scene.add(light);

camera.position.set(0.010479051750400514, -0.7832567275677412, 2.9810063884859894);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x6c16c7, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const distortFragmentShader = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D distortTexture;
uniform sampler2D backgroundTexture;

varying vec2 vUv;

${rgbShift}

void main() {
  vec4 n = texture2D(distortTexture, vUv);
  vec2 offset = .05*n.xy;
  //vec4 bkg = texture2D(backgroundTexture, vUv+offset);
  vec4 bkg = rgbShift(backgroundTexture, vUv+offset, n.xy* 150.);
  gl_FragColor = bkg;
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
  gl_FragColor = colorDodge(finalColor, finalColor);
}
`;

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const backFBO = getFBO(w, h);
  const shockwaveFBO = getFBO(w, h, { type: THREE.HalfFloat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });

  const distortShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      backgroundTexture: { value: backFBO.texture },
      distortTexture: { value: shockwaveFBO.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: distortFragmentShader,
  });
  const distortPass = new ShaderPass(renderer, distortShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: .8 },
      vignetteReduction: { value: .8 },
      inputTexture: { value: distortPass.fbo.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: finalFragmentShader,
  });
  const finalPass = new ShaderPass(renderer, finalShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera) {
    renderer.setClearColor(0x6c16c7, 1);
    if (speaker) speaker.visible = true;
    particles.instancedMesh.visible = true;
    shockwavePlane.visible = false;
    renderer.render(scene, camera, backFBO);

    renderer.setClearColor(0, 0);
    if (speaker) speaker.visible = false;
    particles.instancedMesh.visible = false;
    shockwavePlane.visible = true;
    renderer.render(scene, camera, shockwaveFBO);

    distortPass.render();
    finalPass.render(true);
  }

  return {
    render
  }
}
const post = new Post(renderer);

const loopDuration = 6;

group.rotation.x = -.1;
group.rotation.z = .1;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  const f = 10;
  const s = .5 + .5 * easings.InOutQuad(.5 + .5 * Math.sin(f * t * Maf.TAU));
  if (speaker) speaker.scale.setScalar(.1 * s);
  particles.instancedMesh.scale.setScalar(.85 + .2 * s);
  shockwaveMaterial.uniforms.frequency.value = f;
  shockwaveMaterial.uniforms.time.value = t * Maf.TAU;

  group.rotation.x = (Maf.PI / 8) * Math.sin(t * Maf.TAU);
  group.rotation.y = (Maf.PI / 8) * Math.cos(t * Maf.TAU);

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };