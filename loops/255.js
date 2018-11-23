import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';

import { vs as fireVertexShader } from './255/fire-vs.js';
import { fs as fireFragmentShader } from './255/fire-fs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';
import ShaderPingPongPass from '../modules/shader-ping-pong-pass.js';

import { fs as highlightFragmentShader } from './255/highlight-fs.js';
import { fs as blurFragmentShader } from './255/blur-fs.js';
import { fs as finalFragmentShader } from './255/final-fs.js';
import { fs as finalColorFragmentShader } from './255/final-color-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const loader = new THREE.TextureLoader();
const gradientTexture = loader.load('./loops/255/explosion.png');
gradientTexture.wrapS = gradientTexture.wrapT = THREE.RepeatWrapping;

const geo = new THREE.IcosahedronBufferGeometry(20, 6);
const mat = new THREE.RawShaderMaterial({
  uniforms: {
    gradientTexture: { value: gradientTexture },
    time: { value: 0 }
  },
  vertexShader: fireVertexShader,
  fragmentShader: fireFragmentShader,
});

const fireball = new THREE.Mesh(geo, mat);
fireball.scale.setScalar(.1);
group.add(fireball);
scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);

  const highlightShader = new THREE.RawShaderMaterial({
    uniforms: {
      inputTexture: { value: colorFBO.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: highlightFragmentShader,
  });
  const highlightPass = new ShaderPass(renderer, highlightShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

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

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: params.vignetteBoost || .5 },
      vignetteReduction: { value: params.vignetteReduction || .5 },
      inputTexture: { value: colorFBO.texture },
      blur1Texture: { value: blurPasses[0].fbo.texture },
      blur2Texture: { value: blurPasses[1].fbo.texture },
      blur3Texture: { value: blurPasses[2].fbo.texture },
      blur4Texture: { value: blurPasses[3].fbo.texture },
      blur5Texture: { value: blurPasses[4].fbo.texture },
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

    highlightPass.render();

    let offset = 2;
    blurShader.uniforms.inputTexture.value = highlightPass.fbo.texture;
    for (let j = 0; j < levels; j++) {
      blurShader.uniforms.direction.value.set(offset, 0);
      const blurPass = blurPasses[j];
      blurPass.render();
      blurShader.uniforms.inputTexture.value = blurPass.fbos[blurPass.currentFBO];
      blurShader.uniforms.direction.value.set(0, offset);
      blurPass.render();
      blurShader.uniforms.inputTexture.value = blurPass.fbos[blurPass.currentFBO];
    }

    finalPass.render();
    finalColorPass.render(true);
  }

  return {
    render
  }
}

const post = new Post(renderer);

camera.position.set(5, 3, 6);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0, 0);

const loopDuration = 8;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  mat.uniforms.time.value = t;
  fireball.rotation.y = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };