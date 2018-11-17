import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { OBJLoader } from '../third_party/THREE.OBJLoader.js';

import { vs as stripesVertexShader } from './250/stripes-vs.js';
import { fs as stripesFragmentShader } from './250/stripes-fs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as finalFragmentShader } from './250/final-fs.js';
import { fs as finalColorFragmentShader } from './250/final-color-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const loader = new OBJLoader();
const stripesMaterial = new THREE.MeshStandardMaterial({
  color: 0x808080,
  metalness: 0,
  roughness: .3,
  side: THREE.DoubleSide,
});
stripesMaterial.onBeforeCompile = (shader) => {
  stripesMaterial.uniforms = shader.uniforms;
  shader.uniforms.time = { value: 0 };
  shader.vertexShader = shader.vertexShader.replace(
    `varying vec3 vViewPosition;`,
    `varying vec3 vViewPosition;
varying vec3 vPosition;`);
  shader.vertexShader = shader.vertexShader.replace(
    `#include <defaultnormal_vertex>`,
    `#include <defaultnormal_vertex>
vPosition = position;`);

  shader.fragmentShader = shader.fragmentShader.replace(
    `varying vec3 vViewPosition;`,
    `varying vec3 vViewPosition;
varying vec3 vPosition;

uniform float time;

#define M_PI 3.1415926535897932384626433832795

float pattern(float v, float v2) {
  return .5 + .5 * sin( 5. * 2. * M_PI * v + v2 );
}
`);

  shader.fragmentShader = shader.fragmentShader.replace(
    `#include <map_fragment>`,
    `#include <map_fragment>

vec3 p = vPosition/5.;
float pat = pattern(p.y, atan(p.z,p.x) + time );
float strip = smoothstep( .45, .55, pat);
if(strip>.5) {
  discard;
}
diffuseColor.rgb = (.25*vec3(1.-pat) + diffuseColor.rgb)*vec3(1.,0.,0.);
`);

  shader.fragmentShader = `#extension GL_OES_standard_derivatives : enable
    ${shader.fragmentShader}`;

};

const depthMaterial = new THREE.MeshDepthMaterial({
  depthPacking: THREE.RGBADepthPacking,
  side: THREE.DoubleSide
});
depthMaterial.onBeforeCompile = (shader) => {
  depthMaterial.uniforms = shader.uniforms;
  shader.uniforms.time = { value: 0 };
  shader.vertexShader = shader.vertexShader.replace(
    `#include <common>`,
    `#include <common>
  varying vec3 pos;`);
  shader.vertexShader = shader.vertexShader.replace(
    `#include <begin_vertex>`,
    `#include <begin_vertex>
  pos = position.xyz;`);

  shader.fragmentShader = shader.fragmentShader.replace(
    `#include <common>`,
    `#include <common>
  varying vec3 pos;
  uniform float time;
#define M_PI 3.1415926535897932384626433832795
#define M_TAU (2.*M_PI)
float pattern(float v, float v2) {
    return .5 + .5 * sin( 5. * 2. * M_PI * v + v2 );
}
`);

  shader.fragmentShader = shader.fragmentShader.replace(
    `vec4 diffuseColor = vec4( 1.0 );`,
    `vec4 diffuseColor = vec4( 1.0 );
      vec3 p = pos/5.;
float pat = pattern(p.y, atan(p.z,p.x) + time );
float strip = smoothstep( .45, .55, pat);
if(strip>.5) {
  discard;
}`);

};

let apple;
loader.load('./loops/250/apple.obj', (res) => {
  apple = res.children[0];
  apple.geometry.center();
  const s = 50;
  const a = Maf.PI / 4;
  apple.geometry.applyMatrix(new THREE.Matrix4().makeScale(s, s, s));
  apple.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(a));
  apple.material = stripesMaterial;
  apple.customDepthMaterial = depthMaterial;
  group.add(apple);
  apple.rotation.x = -a;
  apple.castShadow = apple.receiveShadow = true;
});

scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: params.vignetteBoost || .5 },
      vignetteReduction: { value: params.vignetteReduction || .5 },
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

  function render(scene, camera) {
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
directionalLight.shadow.camera.near = -2;
directionalLight.shadow.camera.far = 10;
directionalLight.shadow.bias = 0.0001;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
directionalLight2.shadow.camera.near = -2;
directionalLight2.shadow.camera.far = 10;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(0x776E88, 0xffffff, .5);
scene.add(light);

camera.position.set(6.5, 9.2, -2.3);
camera.position.set(9.76, 1.24, 0.51);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x370000, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  if (apple && apple.material.uniforms) {
    apple.material.uniforms.time.value = 4 * t * Maf.TAU;
    apple.customDepthMaterial.uniforms.time.value = 4 * t * Maf.TAU;
  }

  group.rotation.y = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };