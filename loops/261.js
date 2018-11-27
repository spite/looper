import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { OBJLoader } from '../third_party/THREE.OBJLoader.js';
import pointsOnSphere from '../modules/points-sphere.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';

import { vs as backdropVertexShader } from './261/backdrop-vs.js';
import { fs as backdropFragmentShader } from './261/backdrop-fs.js';
import { vs as pointsVertexShader } from './261/points-vs.js';
import { fs as pointsFragmentShader } from './261/points-fs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as shadowsFragmentShader } from './261/shadows-fs.js';
import { fs as combineFragmentShader } from './261/combine-fs.js';
import { fs as finalFragmentShader } from './261/final-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const NUM = 2;
const skates = [];
const loader = new OBJLoader();

const backdrop = new THREE.Mesh(
  new THREE.IcosahedronBufferGeometry(10, 4),
  new THREE.RawShaderMaterial({
    uniforms: {
      brightColor: { value: new THREE.Color(0xaac9b5) },
      darkColor: { value: new THREE.Color(0x006fb7) },
    },
    vertexShader: backdropVertexShader,
    fragmentShader: backdropFragmentShader,
    side: THREE.BackSide
  })
);
group.add(backdrop);

function fixVertexShader(mat, shader) {
  mat.uniforms = shader.uniforms;
  shader.uniforms.time = { value: 0 };

  shader.vertexShader = `uniform float time;
  varying float vDepth;
  varying vec3 vNormal;
${shader.vertexShader}`;

  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `#include <begin_vertex>
vNormal = normal;

vec3 p = position;
float factor = .3 * sin(time);
if(factor != 0.) {
  float theta = p.x*factor;
  float sint = sin(theta);
  float cost = cos(theta);

  transformed.x = -(p.y-1.0/factor)*sint;
  transformed.y =  (p.y-1.0/factor)*cost + 1.0/factor;
  transformed.z= p.z;
} else {
  transformed = position;
}

p = transformed;
factor = -.2;
float theta = p.z * factor;
float sint = sin(theta);
float cost = cos(theta);

transformed.z = -(p.x-1.0/factor)*sint;
transformed.x =  (p.x-1.0/factor)*cost + 1.0/factor;
transformed.y= p.y;

vec4 mVP = modelViewMatrix * vec4( transformed, 1.0 );
float l =.5* 10.;
vDepth = 1. - (-mVP.z/20. - .5);

`);
}

function fixFragmentShader(mat, shader) {
  shader.fragmentShader = `uniform float time;
  varying float vDepth;
  varying vec3 vNormal;
${shader.fragmentShader}`;
  shader.fragmentShader = shader.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
    `
gl_FragColor = vec4(-vNormal.x, vDepth, 0.,1.);`);
}

function getMaterial() {
  const mat = new THREE.MeshBasicMaterial({ color: 0xdedede, wireframe: false, roughness: .4, metalness: 0 });
  mat.flatShading = true;
  mat.onBeforeCompile = (shader) => {
    fixVertexShader(mat, shader);
    fixFragmentShader(mat, shader);
  }
  return mat;
}

loader.load('./loops/261/manta.obj', (res) => {
  const geometry = res.children[1].geometry;
  geometry.center();
  geometry.applyMatrix(new THREE.Matrix4().makeRotationY(-Maf.PI / 2));
  geometry.applyMatrix(new THREE.Matrix4().makeScale(.0005, .0005, .0005));
  for (let i = 0; i < NUM; i++) {
    const mat = getMaterial();
    const mesh = new THREE.Mesh(geometry, mat);
    group.add(mesh);
    skates.push({ mesh, mat });
  }
});

scene.add(group);

const dustGeometry = new THREE.BufferGeometry();
const vertices = [];
for (let i = 0; i < 1000; i++) {
  const r = 10;
  vertices.push(Maf.randomInRange(-r, r), Maf.randomInRange(-r, r), Maf.randomInRange(-r, r));
}
dustGeometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
const dustMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    size: { value: .1 }
  },
  vertexShader: pointsVertexShader,
  fragmentShader: pointsFragmentShader,
});
const particles = new THREE.Points(dustGeometry, dustMaterial);
group.add(particles);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const backFBO = getFBO(w, h);
  const colorFBO = getFBO(w, h);
  const shadowsFBO = getFBO(.25 * w, .25 * h);

  const shadowsShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: colorFBO.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: shadowsFragmentShader,
  });
  const shadowsPass = new ShaderPass(renderer, shadowsShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const combineShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: colorFBO.texture },
      backTexture: { value: backFBO.texture },
      shadowsTexture: { value: shadowsPass.fbo.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: combineFragmentShader,
  });
  const combinePass = new ShaderPass(renderer, combineShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: .5 },
      vignetteReduction: { value: .5 },
      inputTexture: { value: combinePass.fbo.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: finalFragmentShader,
  });
  const finalPass = new ShaderPass(renderer, finalShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera, t) {
    renderer.setClearColor(0, 0);
    particles.visible = false;
    backdrop.visible = true;
    skates.forEach((s) => s.mesh.visible = false);
    renderer.render(scene, camera, backFBO);
    particles.visible = true;
    backdrop.visible = false;
    skates.forEach((s) => s.mesh.visible = true);
    renderer.render(scene, camera, colorFBO);
    shadowsPass.render();
    combinePass.render();
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

camera.position.set(11, -11, -11);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x776E88, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;
const target = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  const h = .5;
  for (let i = 0; i < skates.length; i++) {
    const s = skates[i];
    const a = i * Maf.TAU / skates.length + t * Maf.PI;
    const r = 4;
    const m = s.mesh;
    const x = r * Math.cos(a);
    const y = h * Math.sin(a);
    const z = r * Math.sin(a);
    m.position.set(x, y, z);
    const a2 = (i + .1) * Maf.TAU / skates.length + t * Maf.PI;
    target.set(
      r * Math.cos(a2),
      h * Math.sin(a2),
      r * Math.sin(a2)
    );
    m.lookAt(target);
    if (s.mat.uniforms) s.mat.uniforms.time.value = i * Maf.TAU / skates.length + 4 * t * Maf.PI;
  }
  particles.rotation.x = .01 * Math.cos(t * Maf.TAU);
  particles.rotation.y = .01 * Math.sin(t * Maf.TAU);
  particles.rotation.z = .01 * Math.cos(.5 + t * Maf.TAU);

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };