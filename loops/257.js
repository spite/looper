import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { createCrystal } from './257/crystal.js';
import { EquirectangularToCubemap } from '../modules/equirectangular-to-cubemap.js';

import { vs as depthVertexShader } from './257/depth-vs.js';
import { fs as depthFragmentShader } from './257/depth-fs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as combineFragmentShader } from './257/combine-fs.js';
import { fs as bokehFragmentShader } from './257/bokeh-fs.js';
import { fs as finalFragmentShader } from './257/final-fs.js';
import { fs as finalColorFragmentShader } from './257/final-color-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const crystalMaterial = new THREE.MeshStandardMaterial({
  metalness: .8,
  roughness: .1,
  refractionRatio: .5,
  color: 0xffffff,
});
var loader = new THREE.TextureLoader();
loader.load('./loops/257/cave.jpg', function(res) {
  var equiToCube = new EquirectangularToCubemap(renderer);
  crystalMaterial.envMap = equiToCube.convert(res, 1024);
  crystalMaterial.envMapIntensity = .25;
  crystalMaterial.needsUpdate = true;
});
crystalMaterial.shading = THREE.FlatShading;
const depthMaterial = new THREE.RawShaderMaterial({
  vertexShader: depthVertexShader,
  fragmentShader: depthFragmentShader,
  side: THREE.FrontSide
});
const jewel = new THREE.Mesh(
  createCrystal(
    ~~Maf.randomInRange(50, 60),
    Maf.randomInRange(0, .5), // .5-2
    Maf.randomInRange(3, 4), //1-3
    Maf.randomInRange(1, 1.5), //.5-1
    Maf.randomInRange(1, 1.5), // 1-2
  ),
  crystalMaterial
);
jewel.castShadow = jewel.receiveShadow = true;
group.add(jewel);
jewel.position.x = 2;
jewel.scale.setScalar(1);

scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);
  const depthFBO = getFBO(w, h, { type: THREE.HalfFloat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });

  const combineShader = new THREE.RawShaderMaterial({
    uniforms: {
      jewelTexture: { value: colorFBO.texture },
      depthTexture: { value: depthFBO.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: combineFragmentShader,
  });
  const combinePass = new ShaderPass(renderer, combineShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const dofShader = new THREE.RawShaderMaterial({
    uniforms: {
      inputTexture: { value: combinePass.fbo.texture },
      depthTexture: { value: depthFBO.texture },
      resolution: { value: new THREE.Vector2(w, h) },
      time: { value: 0 }
    },
    vertexShader: orthoVertexShader,
    fragmentShader: bokehFragmentShader,
  });
  const dofPass = new ShaderPass(renderer, dofShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const finalShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      vignetteBoost: { value: params.vignetteBoost || .5 },
      vignetteReduction: { value: params.vignetteReduction || .5 },
      inputTexture: { value: dofPass.fbo.texture },
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

    renderer.setClearColor(0, 0);
    jewel.material = depthMaterial;
    renderer.render(scene, camera, depthFBO);

    renderer.setClearColor(0x102030, 1);
    jewel.material = crystalMaterial;
    renderer.render(scene, camera, colorFBO);

    combinePass.render();
    dofPass.render();
    finalPass.render();
    finalColorPass.render(true);
  }

  return {
    render
  }
}

const post = new Post(renderer);

const directionalLight = new THREE.DirectionalLight(0x5ca1ff, 2);
directionalLight.position.set(-2, 2, 2);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = -1;
directionalLight.shadow.camera.far = 10;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0x4fbd7b, 2);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
directionalLight2.shadow.camera.near = -4;
directionalLight2.shadow.camera.far = 10;
scene.add(directionalLight2);

camera.position.set(0, 0, 7);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  group.rotation.y = t * Maf.TAU;
  jewel.rotation.x = t * Maf.TAU;

  post.render(scene, camera);

}

export { renderer, draw, loopDuration, canvas };