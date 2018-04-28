import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {MarchingCubes} from '../third_party/THREE.MarchingCubes.js';
import Maf from '../modules/maf.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

function getMaterial() {
  const material = new THREE.MeshStandardMaterial({color: 0xb70000, metalness: .1, roughness: .5, transparent: true, alphaTest: .5, depthWrite: false, depthTest: false, side: THREE.DoubleSide, opacity: 1});
  material.onBeforeCompile = (shader) =>{
    shader.vertexShader = shader.vertexShader.replace(
      `varying vec3 vViewPosition;`,
      `varying vec3 vViewPosition;
  varying vec3 pos;
  varying vec2 vUv;`);
    shader.vertexShader = shader.vertexShader.replace(
      `#include <defaultnormal_vertex>`,
      `#include <defaultnormal_vertex>
  pos = position.xyz;
  vUv = pos.xy;`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `varying vec3 vViewPosition;`,
      `varying vec3 vViewPosition;
  varying vec3 pos;
  varying vec2 vUv;

#define M_PI 3.1415926535897932384626433832795
#define M_TAU (2.*M_PI)

float pattern(vec3 pos){
  float r = sqrt(dot(pos,pos));
  float theta = acos(pos.z/r);
  float phi = atan(pos.y,pos.x);
  float v = theta / M_TAU;
  float m1 = .5+.5*sin(v*M_TAU*32.);
  float res = m1;
  return res + .25;
}
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( diffuse, opacity );
      float strip = pattern(pos);
      diffuseColor.rgb = vec3(1.);
      float s = 1.;

      diffuseColor.a = .5*(1.-smoothstep(.49,.51,strip));`);

  }
  return material;
}

function getDepthMaterial() {
  const material = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking,side: THREE.DoubleSide});
  material.onBeforeCompile = (shader) =>{
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

#define M_PI 3.1415926535897932384626433832795
#define M_TAU 2.*M_PI

float pattern(vec3 pos){
  float r = sqrt(dot(pos,pos));
  float theta = acos(pos.z/r);
  float phi = atan(pos.y,pos.x);
  float v = theta / M_TAU;
  float m1 = .5+.5*sin(v*M_TAU*4.);
  float res = m1;
  return res + .25;
}
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( 1.0 );`,
      `vec4 diffuseColor = vec4( 1.0 );
      float strip = pattern(pos);
      if( smoothstep(.49,.51,strip) >.5){
        discard;
      }`);

  }
  return material;
}

const resolution = 50;
const material = getMaterial();
const effect = new MarchingCubes( resolution, material, true, true );
effect.position.set( 0, 0, 0 );
effect.enableUvs = false;
effect.enableColors = false;
effect.init( resolution );

const effect2 = new MarchingCubes( resolution, material, true, true );
effect2.position.set( 0, 0, 0 );
effect2.enableUvs = false;
effect2.enableColors = false;
effect2.init( resolution );

const effect3 = new MarchingCubes( resolution, material, true, true );
effect3.position.set( 0, 0, 0 );
effect3.enableUvs = false;
effect3.enableColors = false;
effect3.init( resolution );

const mesh = new THREE.Mesh(effect.generateGeometry(), material);
mesh.scale.set( 5, 5, 5 );
mesh.castShadow = mesh.receiveShadow = true;
mesh.customDepthMaterial = getDepthMaterial();
group.add(mesh);

const mesh2 = new THREE.Mesh(effect.generateGeometry(), material);
mesh2.scale.set( 5, 5, 5 );
mesh2.castShadow = mesh2.receiveShadow = true;
group.add(mesh2);

const mesh3 = new THREE.Mesh(effect.generateGeometry(), material);
mesh3.scale.set( 5, 5, 5 );
mesh3.castShadow = mesh3.receiveShadow = true;
group.add(mesh3);

scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set(-1,1,1);
const r = 7;
directionalLight.shadow.camera.near = .001;
directionalLight.shadow.camera.far = 10;
directionalLight.shadow.camera.left = -r;
directionalLight.shadow.camera.right = r;
directionalLight.shadow.camera.top = r;
directionalLight.shadow.camera.bottom = -r;
directionalLight.shadow.camera.updateProjectionMatrix();
directionalLight.castShadow = true;
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight2.position.set(1,2,1);
directionalLight2.shadow.camera.near = .001;
directionalLight2.shadow.camera.far = 10;
directionalLight2.shadow.camera.left = -r;
directionalLight2.shadow.camera.right = r;
directionalLight2.shadow.camera.top = r;
directionalLight2.shadow.camera.bottom = -r;
directionalLight2.shadow.camera.updateProjectionMatrix();
directionalLight2.castShadow = true;
scene.add( directionalLight2 );

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight( 0xcefeff, 0xb3eaf0, .5 );
scene.add( light );

camera.zoom = 1.;
camera.fov = 90;
camera.updateProjectionMatrix();
camera.position.set(6,6,6);
camera.lookAt(new THREE.Vector3(0,0,0));
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;
const cameraOffset = new THREE.Vector3();

const tmpVector = new THREE.Vector3();

const numBlobs = 20;
const blobs = [];
for (let j=0; j<numBlobs; j++) {
  blobs.push({
    theta: Maf.randomInRange(0,Maf.PI),
    phi: Maf.randomInRange(0,Maf.TAU),
    offset: Maf.randomInRange(0,Maf.TAU),
  })
}

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  effect.isolation = 500;
  effect.reset();
  effect2.isolation = 500;
  effect2.reset();
  effect3.isolation = 500;
  effect3.reset();

  const radius = .35;
  for (const blob of blobs) {
    const r = radius * Math.cos(t*Maf.TAU+blob.offset);
    tmpVector.x = r * Math.sin(blob.theta) * Math.cos(blob.phi);
    tmpVector.y = r * Math.sin(blob.theta) * Math.sin(blob.phi);
    tmpVector.z = r * Math.cos(blob.theta);
    const s = 3.;
    const offset = Math.cos(t*Maf.TAU) * s;
    const strength = 2;
    const subtract = 10;
    effect.addBall(tmpVector.x+.5, tmpVector.y+.5, tmpVector.z+.5, strength, subtract);
    const s2 = .5 + .25 * Math.sin(t*Maf.TAU);
    effect2.addBall(tmpVector.x+.5, tmpVector.y+.5, tmpVector.z+.5, s2*strength, subtract);
    const s3 = 1 + .5 * Math.sin(t*Maf.TAU);
    effect3.addBall(tmpVector.x+.5, tmpVector.y+.5, tmpVector.z+.5, s3*strength, subtract);
  }

  mesh.geometry.dispose();
  mesh.geometry = effect.generateGeometry();

  mesh2.geometry.dispose();
  mesh2.geometry = effect2.generateGeometry();

  mesh3.geometry.dispose();
  mesh3.geometry = effect3.generateGeometry();

  mesh.material.opacity = Math.random();

  group.rotation.z = t*Maf.TAU;
  group.rotation.x = t*Maf.TAU;

  const jitter = 0.01;
  directionalLight.position.set(
    1+Maf.randomInRange(-jitter,jitter),
    1+Maf.randomInRange(-jitter,jitter),
    1+Maf.randomInRange(-jitter,jitter),
  );
  directionalLight2.position.set(
    1+Maf.randomInRange(-jitter,jitter),
    2+Maf.randomInRange(-jitter,jitter),
    1+Maf.randomInRange(-jitter,jitter),
  );
  camera.position.set(
    4+Maf.randomInRange(-jitter,jitter),
    4+Maf.randomInRange(-jitter,jitter),
    -4+Maf.randomInRange(-jitter,jitter),
  );
  camera.lookAt(scene.position);

  renderer.render(scene, camera);

}

export { draw, loopDuration, canvas };
