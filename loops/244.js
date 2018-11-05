import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';
import pointsOnSphere from '../modules/points-sphere.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import { sphericalToCartesian, cartesianToSpherical } from '../modules/conversions.js';
import { gradientLinear } from '../modules/gradient.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import vignette from '../shaders/vignette.js';
import fxaa from '../shaders/fxaa.js';
import rgbShift from '../shaders/rgb-shift.js';
import ShaderPass from '../modules/shader-pass.js';
import softLight from '../shaders/soft-light.js';
import { gammaCorrect, levelRange, finalLevels } from '../shaders/levels.js';

const palette = ["#B1C9DD", "#ffffff"];
const gradient = new gradientLinear(palette);

const canvas = renderer.domElement;
const camera = getCamera(35);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

function squareTurbulence(v) {
  return Math.pow(v, 2.);
}

function ridgedTurbulence(v) {
  return 1. - Math.abs(v);
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
  return 2 * squareTurbulence(.3 + value) - 1;
}

function turbulence(x, y, z) {

  let w = 100.0;
  let t = -.5;

  for (let f = 1.0; f <= 10.0; f++) {
    let power = Math.pow(2.0, f);
    t += Math.abs(noise.perlin3(x * power, y * power, z * power));
  }

  return 2 * t;

}

function f(x, y, z, t) {
  const s = 1;
  const ts = 2;
  const t2 = Maf.mod(t + .5, 1);
  const n1 = fbm((x + ts * t) * s, y * s, z * s);
  const n2 = fbm(x * s, y * s, (z + ts * t2) * s);
  return (.5 + .5 * Math.cos(t * Maf.TAU - Maf.PI)) * n1 + (.5 + .5 * Math.cos(t2 * Maf.TAU - Maf.PI)) * n2;
}

const sphere = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(.95, 3), new THREE.MeshStandardMaterial({ color: 0x5F94CA, roughness: .1, metalness: 0 }));
sphere.castShadow = sphere.receiveShadow = true;
group.add(sphere);

const DENSITIES = 50;
const points = pointsOnSphere(10000);
points.forEach((p) => {
  const { r, theta, phi } = cartesianToSpherical(p.x, p.y, p.z);
  const n = f(r, theta, phi, 0) / Maf.TAU;
  const { x, y, z } = sphericalToCartesian(r, theta, phi + n);
  p.set(x, y, z);
})

const geometry = new THREE.IcosahedronBufferGeometry(.01, 1);
const material = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: .1, roughness: .8 }, { colors: true });
//material.shading = THREE.FlatShading;
const depthMaterial = getInstancedDepthMaterial();
const instancedGeometry = new InstancedGeometry(geometry, { size: points.length, colors: true });
const instancedMesh = new THREE.Mesh(instancedGeometry.geometry, material);
instancedMesh.frustumCulled = false;
instancedMesh.castShadow = true;
instancedMesh.receiveShadow = true;
instancedMesh.customDepthMaterial = depthMaterial;
group.add(instancedMesh);

const posValues = instancedGeometry.positions.values;
const quatValues = instancedGeometry.quaternions.values;
const scaleValues = instancedGeometry.scales.values;
const colorValues = instancedGeometry.colors.values;

scene.add(group);

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

camera.position.set(3.3, -.19, 3.41);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x275FA6, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

void main() {
  vec4 color = fxaa(inputTexture, vUv);
  gl_FragColor = softLight(color, vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.));
}
`;

const aberrationFragmentShader = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;

varying vec2 vUv;
${rgbShift}
${gammaCorrect}
${levelRange}
${finalLevels}

void main() {
  vec4 color = rgbShift(inputTexture, vUv, vec2(40.,0.));
  gl_FragColor = vec4(finalLevels(color.rgb,vec3(17., 54., 101.)/255., vec3(1.), vec3(255., 255.,255. )/255.),1.);
}
`;

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
    renderer.render(scene, camera, colorFBO);
    finalPass.render();
    aberrationPass.render(true);
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

  let total = 0;
  let vertices = [];
  for (let j = 0; j < points.length; j++) {
    const p = points[j];
    const n = f(p.x, p.y, p.z, t);
    if (n > 0) {
      const en = easings.InOutQuad(n);
      vertices.push({ point: p.clone().multiplyScalar(1 + .1 * en), scale: 1.5 * en, n: en });
      total++;
    }
  }

  for (let ptr = 0; ptr < total; ptr++) {
    posValues[ptr * 3] = vertices[ptr].point.x;
    posValues[ptr * 3 + 1] = vertices[ptr].point.y;
    posValues[ptr * 3 + 2] = vertices[ptr].point.z;
    scaleValues[ptr * 3] = 1 + vertices[ptr].scale;
    scaleValues[ptr * 3 + 1] = 1 + vertices[ptr].scale;
    scaleValues[ptr * 3 + 2] = 1 + vertices[ptr].scale;
    quatValues[ptr * 4] = 0;
    quatValues[ptr * 4 + 1] = 0;
    quatValues[ptr * 4 + 2] = 0;
    quatValues[ptr * 4 + 3] = 1;
    const c = gradient.getAt(Maf.clamp(vertices[ptr].n, 0, 1));
    colorValues[ptr * 4] = c.r;
    colorValues[ptr * 4 + 1] = c.g;
    colorValues[ptr * 4 + 2] = c.b;
    colorValues[ptr * 4 + 3] = 1;
  }

  instancedGeometry.update(total);
  instancedMesh.rotation.y = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };