import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';

import { fs as pointsFragmentShader } from './246/points-fs.js';
import { vs as pointsVertexShader } from './246/points-vs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import vignette from '../shaders/vignette.js';
import chromaticAberration from '../shaders/chromatic-aberration.js';
import rgbShift from '../shaders/rgb-shift.js';
import ShaderPass from '../modules/shader-pass.js';
import softLight from '../shaders/soft-light.js';
import colorDodge from '../shaders/color-dodge.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

let vertices = [];
let particles = [];

const DENSITY = 100;
const DENSITYPARTICLES = 5;
const RADIAL = 30;
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const radial = []
for (let j = 0; j < RADIAL; j++) {
  const angle = Maf.randomInRange(0, Maf.TAU);
  const r1 = Maf.randomInRange(9, 11);
  const r2 = Maf.randomInRange(4.5, 5.5);
  const top = Maf.randomInRange(2, 3);
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(r1 * Math.cos(angle), top, r1 * Math.sin(angle)),
    new THREE.Vector3(r2 * Math.cos(angle), Maf.randomInRange(.3, .7), r2 * Math.sin(angle)),
    new THREE.Vector3(0, 0, 0)
  );

  const points = curve.getPoints(r1 * DENSITY);
  vertices = vertices.concat(points);
  for (let i = 0; i < DENSITYPARTICLES; i++) {
    particles = particles.concat(curve.getPointAt(Maf.randomInRange(0, 1)));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const obj = new THREE.Line(geometry, lineMaterial);
  radial.push({ curve, obj, angle, top });
  group.add(obj);
  obj.visible = false;
}

radial.sort((a, b) => a.angle - b.angle);

const CIRCLES = 20;
for (let j = 0; j < CIRCLES; j++) {
  const point = j / CIRCLES;
  const untidy = .05 - .05 * (j / CIRCLES);
  for (let i = 0; i < radial.length; i++) {
    const c1 = radial[i].curve;
    const c2 = radial[Maf.mod(i + 1, radial.length)].curve;
    const p1 = c1.getPointAt(Maf.clamp(point + Maf.randomInRange(-untidy, untidy), 0, 1));
    const p2 = c2.getPointAt(Maf.clamp(point + Maf.randomInRange(-untidy, untidy), 0, 1));
    const px = Maf.mix(p1.x, p2.x, .5);
    const py = Maf.mix(p1.y, p2.y, .5);
    const pz = Maf.mix(p1.z, p2.z, .5);
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const l = Math.sqrt(dx * dx + dz * dz);
    const drop = Maf.randomInRange(.2, .5) * l;
    const curve = new THREE.QuadraticBezierCurve3(
      p1,
      new THREE.Vector3(px, py - drop, pz),
      p2,
    );

    const points = curve.getPoints(l * DENSITY);
    vertices = vertices.concat(points);
    for (let i = 0; i < DENSITYPARTICLES * l; i++) {
      particles = particles.concat(curve.getPointAt(Maf.randomInRange(0, 1)));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const obj = new THREE.Line(geometry, lineMaterial);
    const angle = Maf.randomInRange(0, Maf.TAU);
    group.add(obj);
    obj.visible = false;
  }
}

const box = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1), new THREE.MeshNormalMaterial());
box.scale.setScalar(.00001);
box.frustumCulled = false;
group.add(box);

const geometry = new THREE.BufferGeometry();
const positions = [];
const colors = [];
for (let vertex of vertices) {
  positions.push(vertex.x);
  positions.push(vertex.y);
  positions.push(vertex.z);
  colors.push(.5 + .5 * noise.perlin3(vertex.x, vertex.y, vertex.z));
}
geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 1));
geometry.computeBoundingSphere();

const texLoader = new THREE.TextureLoader();
const cocTexture = texLoader.load('./assets/coc.png');

const pointsMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    size: { value: .1 },
    texture: { value: cocTexture },
    isParticle: { value: 0 }
  },
  vertexShader: pointsVertexShader,
  fragmentShader: pointsFragmentShader,
  transparent: true,
  opacity: .5,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
});

renderer.sortObjects = false;
const points = new THREE.Points(geometry, pointsMaterial);
group.add(points);

const particlesGeometry = new THREE.BufferGeometry();
const particlesPositions = [];
const particlesColors = [];
for (let vertex of particles) {
  const r = .02;
  const x = vertex.x + Maf.randomInRange(-r, r);
  const y = vertex.y + Maf.randomInRange(-r, r);
  const z = vertex.z + Maf.randomInRange(-r, r);
  particlesPositions.push(x);
  particlesPositions.push(y);
  particlesPositions.push(z);
  particlesColors.push(.5 + .5 * noise.perlin3(x, y, z));
}
particlesGeometry.addAttribute('position', new THREE.Float32BufferAttribute(particlesPositions, 3));
particlesGeometry.addAttribute('color', new THREE.Float32BufferAttribute(particlesColors, 1));
particlesGeometry.computeBoundingSphere();

const particlesMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    size: { value: .1 },
    texture: { value: cocTexture },
    isParticle: { value: 1 }
  },
  vertexShader: pointsVertexShader,
  fragmentShader: pointsFragmentShader,
  transparent: true,
  opacity: .5,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
});

const particlesPoints = new THREE.Points(particlesGeometry, particlesMaterial);
group.add(particlesPoints);

scene.add(group);

const finalFragmentShader = `
precision highp float;

uniform vec2 resolution;

uniform sampler2D inputTexture;
uniform float vignetteBoost;
uniform float vignetteReduction;

varying vec2 vUv;
${vignette}
${softLight}
${colorDodge}
${rgbShift}

void main() {
  vec4 color = rgbShift(inputTexture, vUv, vec2(10.));
  vec4 finalColor = softLight(color, vec4(vec3(vignette(vUv, vignetteBoost, vignetteReduction)),1.));
  gl_FragColor = finalColor;
}
`;

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: .8 },
      vignetteReduction: { value: .8 },
      inputTexture: { value: colorFBO.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: finalFragmentShader,
  });
  const finalPass = new ShaderPass(renderer, finalShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera) {
    renderer.render(scene, camera, colorFBO);
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

camera.position.set(5, 3, 6);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 6;

const target = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  const r = 1 + 4.5 + 1.5 * Math.cos(t * Maf.TAU + .5 * Maf.PI);
  camera.position.x = r * Math.cos(t * Maf.TAU);
  camera.position.y = 2 + .5 * Math.sin(2 * t * Maf.TAU);
  camera.position.z = r * Math.sin(t * Maf.TAU);

  const r2 = 2 + 1 * Math.cos(t * Maf.TAU + .25 * Maf.PI);
  target.x = r2 * Math.cos(t * Maf.TAU);
  target.y = 1 + .5 * Math.sin(t * Maf.TAU);
  target.z = r2 * Math.sin(t * Maf.TAU);
  group.rotation.x = .2 * Math.sin(t * Maf.TAU);

  camera.lookAt(target);

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };