import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const objects = [];

function getMaterial() {
  const material = new THREE.MeshStandardMaterial({
    wireframe: !true,
    color: 0xb70000,
    metalness: 0,
    roughness: .5,
    side: THREE.DoubleSide,
  });
  material.flatShading = true;
  material.onBeforeCompile = (shader) => {
    material.uniforms = shader.uniforms;
    shader.uniforms.time = { value: 0 };
    shader.uniforms.radius = { value: 0 };
    shader.uniforms.offset = { value: 0 };
    shader.uniforms.scale = { value: 0 };
    shader.vertexShader = `uniform float time;
uniform float radius;
uniform float offset;
uniform float scale;
${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
        `#include <project_vertex>`,
        `float y = (position.y +.5);
  float a = time * 2. * 3.14159 + y + offset;
  float px = radius * cos(a);
  float py = radius * sin(a);
  float ta = a;// + .5 * 3.14159;
  float tx = position.x + cos(ta);
  float ty = position.y + sin(ta);
  transformed = 1. * vec3(tx,ty,position.z) + vec3(px,py,0.);
  #include <project_vertex>`);
    return shader;
  }
  return material;
}

function getDepthMaterial() {
  const material = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide});
  material.onBeforeCompile = (shader) => {
    material.uniforms = shader.uniforms;
    shader.uniforms.time = { value: 0 };
    shader.uniforms.radius = { value: 0 };
    shader.uniforms.offset = { value: 0 };
    shader.uniforms.scale = { value: 0 };
    shader.vertexShader = `uniform float time;
uniform float radius;
uniform float offset;
uniform float scale;
${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
        `#include <project_vertex>`,
        `float y = (position.y +.5);
  float a = time * 2. * 3.14159 + y + offset;
  float px = radius * cos(a);
  float py = radius * sin(a);
  float ta = a;// + .5 * 3.14159;
  float tx = position.x + cos(ta);
  float ty = position.y + sin(ta);
  transformed = 1. * vec3(tx,ty,position.z) + vec3(px,py,0.);
  #include <project_vertex>`);
    return shader;
  }
  return material;
}

const colors = [
  new THREE.Color().setHex(0xb70000),
  new THREE.Color().setHex(0xaaaaaa),
  new THREE.Color().setHex(0x404040),
];

const geo = new THREE.IcosahedronBufferGeometry(1., 4);
//const geo = new THREE.BoxBufferGeometry(1., 1.,1.,10,10,10);
for (let j=0; j<20; j++) {
  const mat = getMaterial();
  mat.color = colors[Math.floor(Math.random()*colors.length)];
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = Maf.randomInRange(-.5,.5);
  mesh.rotation.x = Maf.randomInRange(-.1,.1);
  mesh.customDepthMaterial = getDepthMaterial();
  mesh.castShadow = mesh.receiveShadow = true;
  group.add(mesh);
  const radius = Maf.randomInRange(3,4);
  const offset = Maf.randomInRange(0,Maf.TAU);
  const speed = Maf.randomInRange(1,2);
  const scale = Maf.randomInRange(.1,.5);
  objects.push({mesh,radius,offset,speed,scale});
}
scene.add(group);
scene.scale.setScalar(.5);

const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
directionalLight.position.set(-1, 1, 1);
directionalLight.castShadow = true;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(0xcefeff, 0xb3eaf0, .5);
scene.add(light);

camera.position.set(0, 0, 10);
camera.lookAt(scene.position);
renderer.setClearColor(0xffffff, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;
  for (const object of objects) {
    if (object.mesh.material.uniforms) {
      object.mesh.material.uniforms.time.value = t + object.speed;
      object.mesh.material.uniforms.radius.value = object.radius;
      object.mesh.material.uniforms.offset.value = object.offset;
      object.mesh.material.uniforms.scale.value = object.scale;
      object.mesh.customDepthMaterial.uniforms.time.value = t + object.speed;
      object.mesh.customDepthMaterial.uniforms.radius.value = object.radius;
      object.mesh.customDepthMaterial.uniforms.offset.value = object.offset;
      object.mesh.customDepthMaterial.uniforms.scale.value = object.scale;
    }
  }
  group.rotation.x = .1 * Maf.PI;
  group.rotation.y = .25 * Maf.PI + 1.5 * easings.InOutQuad( .5 + .5 * Math.cos(t*Maf.TAU) );

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
