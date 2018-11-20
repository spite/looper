import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { sphericalToCartesian } from '../modules/conversions.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';
import ShaderPingPongPass from '../modules/shader-ping-pong-pass.js';

import { vs as torusVertexShader } from './253/torus-vs.js';
import { fs as torusFragmentShader } from './253/torus-fs.js';
import { vs as discVertexShader } from './253/disc-vs.js';
import { fs as discFragmentShader } from './253/disc-fs.js';
import { fs as combineFragmentShader } from './253/combine-fs.js';
import { fs as blurFragmentShader } from './253/blur-fs.js';
import { vs as glowVertexShader } from './253/glow-vs.js';
import { fs as glowFragmentShader } from './253/glow-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const blackHole = new THREE.Group();

const blackHoleRadius = 2;

const loader = new THREE.TextureLoader();
const spaceTexture = loader.load('./loops/253/stars.jpg');
const backdrop = new THREE.Mesh(
  new THREE.IcosahedronBufferGeometry(20, 3),
  new THREE.MeshBasicMaterial({
    map: spaceTexture,
    side: THREE.BackSide,
    color: 0x404040
  }));
backdrop.material.map.wrapS = backdrop.material.map.wrapT = THREE.RepeatWrapping;
group.add(backdrop);

const material = new THREE.RawShaderMaterial({
  uniforms: {
    spaceTexture: { value: spaceTexture }
  },
  vertexShader: torusVertexShader,
  fragmentShader: torusFragmentShader,
  transparent: true,
});
const torus = new THREE.Mesh(
  new THREE.TorusBufferGeometry(2, 2, 36, 100),
  material
);
blackHole.add(torus);

const body = new THREE.Mesh(
  new THREE.IcosahedronBufferGeometry(blackHoleRadius, 3),
  new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: !true })
);
blackHole.add(body);

const noiseTexture = loader.load('./loops/253/swirl.jpg');
noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;
const discMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    radius: { value: blackHoleRadius },
    max: { value: 0 },
    repeat: { value: 0 },
    noiseTexture: { value: noiseTexture },
    time: { value: 0 },
    opacity: { value: .25 }
  },
  vertexShader: discVertexShader,
  fragmentShader: discFragmentShader,
  transparent: true,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide
});
const discRadius1 = 2;
const disc1 = new THREE.Mesh(
  new THREE.TorusBufferGeometry(blackHoleRadius + discRadius1, discRadius1, 36, 100),
  discMaterial
);
disc1.scale.z = .1;
disc1.material.uniforms.repeat.value = 3;
disc1.material.uniforms.radius.value = blackHoleRadius;
disc1.material.uniforms.max.value = discRadius1;
blackHole.add(disc1);

const discRadius2 = 20;
const disc2 = new THREE.Mesh(
  new THREE.TorusBufferGeometry(blackHoleRadius + discRadius2, discRadius2, 36, 100),
  discMaterial.clone()
);
disc2.material.uniforms.noiseTexture.value = noiseTexture;
disc2.material.uniforms.repeat.value = 10;
disc2.material.uniforms.radius.value = blackHoleRadius;
disc2.material.uniforms.max.value = discRadius2;
disc2.material.uniforms.opacity.value = .5;
disc2.rotation.x = Maf.PI / 2;
disc2.scale.z = .01;
group.add(disc2);

const dustGeometry = new THREE.BufferGeometry();
const vertices = [];
for (let i = 0; i < 10000; i++) {
  const r = Maf.randomInRange(blackHoleRadius, blackHoleRadius + .5 * discRadius2);
  const theta = Maf.randomInRange(0, Maf.TAU);
  const phi = Maf.randomInRange(-.1, .1);
  const p = sphericalToCartesian(r, theta, phi);
  vertices.push(p.x, p.y, p.z);
}
dustGeometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
const dustMaterial = new THREE.PointsMaterial({ size: .05, map: loader.load('./loops/253/dust.png'), sizeAttenuation: true, depthWrite: false, opacity: .1, transparent: true });
dustMaterial.color.setHSL(1.0, 0.3, 0.7);
const particles = new THREE.Points(dustGeometry, dustMaterial);
group.add(particles);

const glowRadius = 20;
const glowMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    max: { value: glowRadius / 2 },
  },
  vertexShader: glowVertexShader,
  fragmentShader: glowFragmentShader,
  transparent: true,
});
const glow = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(glowRadius, glowRadius),
  glowMaterial
);
blackHole.add(glow);

group.add(blackHole);
scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const backFBO = getFBO(w, h);
  const glowFBO = getFBO(w, h);
  const discFBO = getFBO(w, h);

  const blurPasses = [];
  const levels = 5;
  const blurShader = new THREE.RawShaderMaterial({
    uniforms: {
      inputTexture: { value: null },
      resolution: { value: new THREE.Vector2(w, h) },
      direction: { value: new THREE.Vector2(0, 1) }
    },
    vertexShader: orthoVertexShader,
    fragmentShader: blurFragmentShader,
  });
  let tw = w;
  let th = h;
  for (let i = 0; i < levels; i++) {
    tw /= 2;
    th /= 2;
    tw = Math.round(tw);
    th = Math.round(th);
    const blurPass = new ShaderPingPongPass(renderer, blurShader, tw, th, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);
    blurPasses.push(blurPass);
  }

  const combineShader = new THREE.RawShaderMaterial({
    uniforms: {
      backTexture: { value: backFBO.texture },
      discTexture: { value: discFBO.texture },
      glowTexture: { value: glowFBO.texture },
      blur1Texture: { value: blurPasses[0].fbo.texture },
      blur2Texture: { value: blurPasses[1].fbo.texture },
      blur3Texture: { value: blurPasses[2].fbo.texture },
      blur4Texture: { value: blurPasses[3].fbo.texture },
      blur5Texture: { value: blurPasses[4].fbo.texture },
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: params.vignetteBoost || .5 },
      vignetteReduction: { value: params.vignetteReduction || .5 },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: combineFragmentShader,
  });
  const combinePass = new ShaderPass(renderer, combineShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  function render(scene, camera) {
    backdrop.visible = true;
    torus.visible = true;
    body.visible = true;
    glow.visible = false;
    disc1.visible = false;
    disc2.visible = false;

    renderer.render(scene, camera, backFBO);

    backdrop.visible = false;
    torus.visible = false;
    glow.visible = false;
    disc1.visible = true;
    disc2.visible = true;

    renderer.render(scene, camera, discFBO);

    backdrop.visible = false;
    torus.visible = false;
    glow.visible = true;
    disc1.visible = false;
    disc2.visible = false;

    renderer.render(scene, camera, glowFBO);

    let v = 1;

    let offset = 4;
    blurShader.uniforms.inputTexture.value = discFBO;
    for (let j = 0; j < levels; j++) {
      blurShader.uniforms.direction.value.set(offset, 0);
      const blurPass = blurPasses[j];
      blurPass.render();
      blurShader.uniforms.inputTexture.value = blurPass.fbos[blurPass.currentFBO];
      blurShader.uniforms.direction.value.set(0, offset);
      blurPass.render();
      blurShader.uniforms.inputTexture.value = blurPass.fbos[blurPass.currentFBO];
    }

    combinePass.render(true);
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

const center = new THREE.Vector3(0, 0, 20);
camera.position.copy(center);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 6;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  disc1.material.uniforms.time.value = t;
  disc2.material.uniforms.time.value = t;

  camera.position.copy(center);
  camera.position.x += 3 * Math.sin(t * Maf.TAU);
  camera.position.y += .1 * Math.cos(t * Maf.TAU);
  camera.position.y += 3 * Math.cos(t * Maf.TAU);
  camera.lookAt(blackHole.position);
  camera.rotation.z = .01 * Maf.TAU;
  blackHole.lookAt(camera.position);

  group.rotation.y = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };