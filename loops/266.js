import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { GLTFLoader } from '../third_party/THREE.GLTFLoader.js';

import { vs as gBufferVertexShader } from './266/gbuffer-vs.js';
import { fs as gBufferFragmentShader } from './266/gbuffer-fs.js';

import { getFBO } from '../modules/fbo.js';
import orthoVertexShader from '../shaders/ortho.js';
import ShaderPass from '../modules/shader-pass.js';

import { fs as edgesFragmentShader } from './266/edges-fs.js';
import { fs as combineFragmentShader } from './266/combine-fs.js';
import { fs as finalFragmentShader } from './266/final-fs.js';
import { fs as finalColorFragmentShader } from './266/final-color-fs.js';

const canvas = renderer.domElement;
const camera = getCamera(45);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const NUM = 10;
const beds = [];
const loader = new GLTFLoader();

const bedMaterial = new THREE.MeshStandardMaterial({
  color: 0xdedede,
  roughness: .6,
  metalness: 0,
});
const redMaterial = new THREE.MeshStandardMaterial({
  color: 0xb70000,
  roughness: .6,
  metalness: 0,
});
const orangeMaterial = new THREE.MeshStandardMaterial({
  color: 0xf98b15,
  roughness: .6,
  metalness: 0,
});
const frameMaterial = new THREE.MeshStandardMaterial({
  color: 0xc45b15,
  roughness: .6,
  metalness: 0,
});
const normalMaterial = new THREE.RawShaderMaterial({
  vertexShader: gBufferVertexShader,
  fragmentShader: gBufferFragmentShader,
});

// https://sketchfab.com/models/d3825852d4264688af04c6e6a48dab84
loader.load('./loops/266/scene.gltf', (res) => {
  for (let j = 0; j < NUM; j++) {
    const bed = new THREE.Group();
    const pivot = new THREE.Group();
    let c = 0;
    res.scene.traverse(function(child) {
      if (child.isMesh) {
        const m = child.clone();
        m.material = bedMaterial;
        if (c === 0) m.material = bedMaterial; // cushions
        if (c === 1) m.material = bedMaterial; // mattress
        if (c === 3) m.material = frameMaterial; // legs
        if (c === 4) m.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(j / NUM, .75, .5),
          roughness: .6,
          metalness: 0,
        }); // duvet
        if (c === 5) m.material = frameMaterial; // frame
        m.castShadow = m.receiveShadow = true;
        bed.add(m);
        c++;
      }
    });
    pivot.add(bed);
    group.add(pivot);
    beds.push({ bed, pivot });
  }
});
group.scale.setScalar(.3);
group.rotation.x = -Maf.PI / 2;
scene.add(group);

function Post(renderer, params = {}) {

  const w = renderer.getSize().width;
  const h = renderer.getSize().height;

  const colorFBO = getFBO(w, h);
  const normalFBO = getFBO(w, h);

  const edgesShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: normalFBO.texture },
    },
    vertexShader: orthoVertexShader,
    fragmentShader: edgesFragmentShader,
  });
  const edgesPass = new ShaderPass(renderer, edgesShader, w, h, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.LinearFilter, THREE.LinearFilter, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);

  const combineShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(w, h) },
      inputTexture: { value: colorFBO.texture },
      edgesTexture: { value: edgesPass.fbo.texture },
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
    scene.overrideMaterial = normalMaterial;
    renderer.setClearColor(0, 0);
    renderer.render(scene, camera, normalFBO);
    scene.overrideMaterial = null;
    renderer.setClearColor(0xc257d5, 1);
    renderer.render(scene, camera, colorFBO);

    edgesPass.render();
    combinePass.render();
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

camera.position.set(-5.78, 8.95, 6.94);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x776E88, 1);
scene.fog = new THREE.FogExp2(0x776E88, .03);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  if (beds.length) {
    for (let j = 0; j < NUM; j++) {
      const a = j * Maf.TAU / NUM;
      const r = 10;
      const x = r * Math.cos(a);
      const y = r * Math.sin(a);
      const z = 0;
      beds[j].pivot.position.set(x, y, z);
      beds[j].pivot.rotation.z = a + t * Maf.TAU;
      beds[j].bed.rotation.x = .2 * Math.sin(t * Maf.TAU + a);
      beds[j].pivot.rotation.y = .4 * Math.sin(t * Maf.TAU);
    }
  }

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };