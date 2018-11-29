import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial } from '../modules/instanced.js';
import { getScrewDriverBody, getScrewDriverTip } from './265/screwdriver.js';
import pointsOnSphere from '../modules/points-sphere.js';
import { EquirectangularToCubemap } from '../modules/equirectangular-to-cubemap.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as finalFragmentShader } from './265/final-fs.js';
import { fs as finalColorFragmentShader } from './265/final-color-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const bodyGeometry = getScrewDriverBody();
const tipGeometry = getScrewDriverTip();
tipGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, 2));

const OBJECTS = 150;
const points = pointsOnSphere(OBJECTS);

const bodyMaterial = getInstancedMeshStandardMaterial({ color: 0xb70000, metalness: .3, roughness: .2 }, { colors: false });
const depthMaterial = getInstancedDepthMaterial();
const instancedBodyGeometry = new InstancedGeometry(bodyGeometry, { size: OBJECTS, colors: true });
const instancedBodyMesh = new THREE.Mesh(instancedBodyGeometry.geometry, bodyMaterial);
instancedBodyMesh.frustumCulled = false;
instancedBodyMesh.castShadow = true;
instancedBodyMesh.receiveShadow = true;
instancedBodyMesh.customDepthMaterial = depthMaterial;
group.add(instancedBodyMesh);

const bodyPosValues = instancedBodyGeometry.positions.values;
const bodyQuatValues = instancedBodyGeometry.quaternions.values;
const bodyScaleValues = instancedBodyGeometry.scales.values;

let ptr = 0;
const center = new THREE.Vector3(0, 0, 0);
const up = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();
const m = new THREE.Matrix4();
const m3 = new THREE.Matrix4();
const m2 = new THREE.Matrix4();
const q = new THREE.Quaternion();
for (let k = 0; k < OBJECTS; k++) {
  bodyScaleValues[ptr * 3 + 0] = .1;
  bodyScaleValues[ptr * 3 + 1] = .1;
  bodyScaleValues[ptr * 3 + 2] = .1;
  ptr++;
}
instancedBodyGeometry.update(OBJECTS);

const tipMaterial = getInstancedMeshStandardMaterial({ color: 0xffffff, metalness: .8, roughness: .1 }, { colors: false });
const instancedTipGeometry = new InstancedGeometry(tipGeometry, { size: OBJECTS, colors: true });
const instancedTipMesh = new THREE.Mesh(instancedTipGeometry.geometry, tipMaterial);
instancedTipMesh.frustumCulled = false;
instancedTipMesh.castShadow = true;
instancedTipMesh.receiveShadow = true;
instancedTipMesh.customDepthMaterial = depthMaterial;
group.add(instancedTipMesh);

const tipPosValues = instancedTipGeometry.positions.values;
const tipQuatValues = instancedTipGeometry.quaternions.values;
const tipScaleValues = instancedTipGeometry.scales.values;

ptr = 0;
for (let k = 0; k < OBJECTS; k++) {
  tipScaleValues[ptr * 3 + 0] = .1;
  tipScaleValues[ptr * 3 + 1] = .1;
  tipScaleValues[ptr * 3 + 2] = .1;
  ptr++;
}
instancedTipGeometry.update(OBJECTS);

group.scale.setScalar(3.5);
scene.add(group);

const offsets = [];
for (let p = 0; p < OBJECTS; p++) {
  offsets.push({
    speed: 1 + ~~Maf.randomInRange(1, 3),
    offset: Maf.randomInRange(0, 1),
  })
}

var loader = new THREE.TextureLoader();
loader.load('./loops/263/envmap.jpg', function(res) {
  var equiToCube = new EquirectangularToCubemap(renderer);
  bodyMaterial.envMap = equiToCube.convert(res, 1024);
  bodyMaterial.envMapIntensity = .25;
  bodyMaterial.needsUpdate = true;
  tipMaterial.envMap = equiToCube.convert(res, 1024);
  tipMaterial.envMapIntensity = .75;
  tipMaterial.needsUpdate = true;
});

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
    renderer.render(scene, camera, colorFBO);
    finalPass.render(true);
    //finalColorPass.render(true);
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

camera.position.set(0, 0, 15);
camera.lookAt(new THREE.Vector3(0, 0, 0));
const color = 0x486e8f;
renderer.setClearColor(color, 1);
scene.fog = new THREE.FogExp2(color, .03);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const mRot = new THREE.Matrix4().makeRotationX(Maf.PI);
const mRot2 = new THREE.Matrix4();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  let ptr = 0;
  for (let p = 0; p < points.length; p++) {
    const f = (easings.OutQuad(Maf.mod(t + offsets[p].offset, 1)));
    //const aa = Maf.mod(Math.atan2(points[p].z, points[p].x), Maf.TAU);
    //const f = Maf.mod(t + .1 * offsets[p].offset + 2 * aa / Maf.TAU, 1); //(easings.OutQuad(Maf.mod(t + offsets[p].offset, 1)));
    const offset = 2;
    tmp.set(points[p].x, points[p].y, points[p].z).multiplyScalar(1 + .2 * easings.InOutQuad(Maf.parabola(f, 1) * offset));
    bodyPosValues[ptr * 3 + 0] = tmp.x;
    bodyPosValues[ptr * 3 + 1] = tmp.y;
    bodyPosValues[ptr * 3 + 2] = tmp.z;
    tipPosValues[ptr * 3 + 0] = tmp.x;
    tipPosValues[ptr * 3 + 1] = tmp.y;
    tipPosValues[ptr * 3 + 2] = tmp.z;

    let a = f * offsets[p].speed * Maf.TAU / 2;

    mRot2.makeRotationZ(a);
    m.lookAt(center, tmp, up);
    m.multiply(mRot2);
    m.multiply(mRot);
    q.setFromRotationMatrix(m);
    bodyQuatValues[ptr * 4 + 0] = q.x;
    bodyQuatValues[ptr * 4 + 1] = q.y;
    bodyQuatValues[ptr * 4 + 2] = q.z;
    bodyQuatValues[ptr * 4 + 3] = q.w;
    tipQuatValues[ptr * 4 + 0] = q.x;
    tipQuatValues[ptr * 4 + 1] = q.y;
    tipQuatValues[ptr * 4 + 2] = q.z;
    tipQuatValues[ptr * 4 + 3] = q.w;

    ptr++;
  }
  instancedBodyGeometry.positions.update(OBJECTS);
  instancedTipGeometry.positions.update(OBJECTS);
  instancedBodyGeometry.quaternions.update(OBJECTS);
  instancedTipGeometry.quaternions.update(OBJECTS);

  group.rotation.x = .1 * Math.sin(t * Maf.TAU);
  group.rotation.z = .1 * Math.cos(t * Maf.TAU);

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };