import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';
import { gradientLinear } from '../modules/gradient.js';

import { getFBO } from '../modules/fbo.js';
import { fs as depthFragmentShader } from './243/depth-fs.js';
import { vs as depthVertexShader } from './243/depth-vs.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';
import softLight from '../shaders/soft-light.js';
import screen from '../shaders/screen.js';
import overlay from '../shaders/overlay.js';
import vignette from '../shaders/vignette.js';
import fxaa from '../shaders/fxaa.js';
import chromaticAberration from '../shaders/chromatic-aberration.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const palette = ["#D82C06", "#FFCF3C", "#F45B0B", "#F49A4A"];
const gradient = new gradientLinear(palette);

const cr = .2;
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1, Maf.randomInRange(-cr, cr), Maf.randomInRange(-cr, cr)),
  new THREE.Vector3(-.5, Maf.randomInRange(-cr, cr), Maf.randomInRange(-cr, cr)),
  new THREE.Vector3(0, Maf.randomInRange(-cr, cr), Maf.randomInRange(-cr, cr)),
  new THREE.Vector3(.5, Maf.randomInRange(-cr, cr), Maf.randomInRange(-cr, cr)),
  new THREE.Vector3(1, Maf.randomInRange(-cr, cr), Maf.randomInRange(-cr, cr)),
  //  new THREE.Vector3(-1, 0, 0),
  //  new THREE.Vector3(1, 0, 0)
]);

const slices = [];
const SLICES = 50;
const LENGTH = 5;
const RADIUS = .25;
const up = new THREE.Vector3(0, 1, 0);
const mat = new THREE.Matrix4();
const rotMat = new THREE.Matrix4();
const material = new THREE.MeshStandardMaterial({ color: palette[2], wireframe: !true, roughness: .8, metalness: .1 });
for (let j = 0; j < SLICES; j++) {
  const pivot = new THREE.Group();
  const p = curve.getPoint(j / SLICES);
  const pp = curve.getPoint(Maf.clamp((j + 1) / SLICES, 0, 1));
  const r = RADIUS * (.01 + Maf.parabola(easings.OutQuad(j / SLICES), .5) * Maf.randomInRange(.95, 1.05));
  const geometry = new RoundedExtrudedPolygonGeometry(r, LENGTH / SLICES, 20, 1, .01, .05, 10);
  const mesh = new THREE.Mesh(geometry, material);
  mat.lookAt(p, pp, up);
  rotMat.makeRotationZ(j * Maf.TAU / SLICES);
  mat.multiply(rotMat);
  pivot.position.copy(p);
  pivot.setRotationFromMatrix(mat);
  pivot.add(mesh);
  mesh.castShadow = mesh.receiveShadow = true;
  group.add(pivot);
  slices.push({
    mesh,
    pivot
  });
}

const depthMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    level: { value: 0 },
    time: { value: 0 },
    color: { value: new THREE.Color(237 - 10, 201 - 10, 175 - 10) },
    topColor: { value: new THREE.Color(237, 201, 175) }
  },
  vertexShader: depthVertexShader,
  fragmentShader: depthFragmentShader,
  side: THREE.DoubleSide
});

scene.add(group);

const combineFragmentShader = `
precision highp float;

${softLight}
${screen}
${overlay}

uniform vec2 resolution;

uniform sampler2D colorTexture;
uniform sampler2D depthTexture;

varying vec2 vUv;

void main() {
  vec4 color = texture2D(colorTexture, vUv);
  vec4 depth = texture2D(depthTexture, vUv);
  float z = smoothstep(.25,.75,(depth.x));
  float rim = depth.y;//1.-smoothstep(0.,1.,depth.y);
  float light = .2*depth.z;
  vec4 res1 = screen(color, vec4(vec3(light),1.),1.);
  vec4 res2 = overlay(res1, vec4(vec3(rim),1.), .1);
  vec4 res3 = screen(res2, vec4(vec3(1.-rim),1.), .1);
  gl_FragColor = overlay(res3,vec4(vec3(1.-.5*rim),1.),1.);
  gl_FragColor.a = depth.a;
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
${chromaticAberration}

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
${chromaticAberration}

void main() {
  vec4 color = chromaticAberration(inputTexture, vUv);
  gl_FragColor = color;
}
`;

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);
  const depthFBO = getFBO(w, h);

  const shader = new THREE.RawShaderMaterial({
    uniforms: {
      depthTexture: { value: depthFBO.texture },
      colorTexture: { value: colorFBO.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: combineFragmentShader,
  });
  const combine = new ShaderPass(renderer, shader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: params.vignetteBoost || .5 },
      vignetteReduction: { value: params.vignetteReduction || .5 },
      inputTexture: { value: combine.fbo.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: finalFragmentShader,
  });
  const finalPass = new ShaderPass(renderer, finalShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const aberrationShader = new THREE.RawShaderMaterial({
    uniforms: {
      inputTexture: { value: finalPass.fbo.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: aberrationFragmentShader,
  });
  const aberrationPass = new ShaderPass(renderer, aberrationShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera) {
    renderer.setClearColor(0, 0);
    scene.overrideMaterial = depthMaterial;
    renderer.render(scene, camera, depthFBO);
    renderer.setClearColor(0x202020, 1);
    scene.overrideMaterial = null;
    renderer.render(scene, camera, colorFBO);
    combine.render();
    finalPass.render();
    aberrationPass.render(true);
  }

  return {
    render
  }
}

const post = new Post(renderer);

const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
directionalLight.position.set(-2, 2, 2);
directionalLight.castShadow = true;
const s = 2;
directionalLight.shadow.camera.left = -s;
directionalLight.shadow.camera.top = s;
directionalLight.shadow.camera.right = s;
directionalLight.shadow.camera.bottom = -s;
directionalLight.shadow.camera.near = -1;
directionalLight.shadow.camera.far = 10;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
directionalLight2.shadow.camera.left = -s;
directionalLight2.shadow.camera.top = s;
directionalLight2.shadow.camera.right = s;
directionalLight2.shadow.camera.bottom = -s;
directionalLight2.shadow.camera.near = -1;
directionalLight2.shadow.camera.far = 10;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(0x776E88, 0xffffff, .5);
scene.add(light);

camera.position.set(.8, 2.25, 1.97);
camera.position.set(.12, -1.7, 3.15);
camera.near = .1;
camera.far = 5;
camera.updateProjectionMatrix();
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x776E88, 1);
//scene.fog = new THREE.FogExp2(0x776E88, .3);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  const r = .5 + .5 * Math.sin(t * Maf.TAU);
  const freq = 3;
  slices.forEach((s, i) => {
    s.mesh.position.x = .5 * r * Math.cos(i * Maf.TAU / SLICES + freq * t * Maf.TAU);
    s.mesh.position.y = .5 * r * Math.sin(i * Maf.TAU / SLICES + freq * t * Maf.TAU);
    s.mesh.rotation.x = r * Maf.PI;
  });

  group.rotation.y = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };