import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {MarchingCubes} from '../third_party/THREE.MarchingCubes.js';
import Maf from '../modules/maf.js';
import noise from '../third_party/perlin.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

function getMaterial() {
  const material = new THREE.MeshStandardMaterial({color: 0x5186a6, metalness: .1, roughness: .1, transparent: true, alphaTest: .5, side: THREE.DoubleSide, opacity: 1});
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
#define M_TAU 2.*M_PI

float pattern(vec3 pos){
  float r = sqrt(dot(pos,pos));
  float theta = acos(pos.z/r);
  float phi = atan(pos.y,pos.x);
  return smoothstep(.3,.7,.5 + .5 *cos(20.*(theta)+r+2.*phi));
}
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( diffuse, opacity );
      float strip = pattern(pos);
      diffuseColor.rgb = vec3(.7);
      diffuseColor.a = smoothstep(.49,.51,strip);`);

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
  return smoothstep(.3,.7,.5 + .5 *cos(20.*(theta)+r+2.*phi));
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

const resolution = 64;
const material = getMaterial();
const effect = new MarchingCubes( resolution, material, true, true );
effect.position.set( 0, 0, 0 );
effect.enableUvs = false;
effect.enableColors = false;
effect.init( resolution );
effect.isolation = 20;

const mesh = new THREE.Mesh(effect.generateGeometry(), material);
mesh.scale.set( 5, 5, 5 );
mesh.castShadow = mesh.receiveShadow = true;
mesh.customDepthMaterial = getDepthMaterial();
group.add(mesh);

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
camera.position.set(0,0,6);
camera.lookAt(new THREE.Vector3(0,0,0));
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 8;
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

  const radius = .35;
  for (const blob of blobs) {
    const r = radius * Math.cos(t*Maf.TAU+blob.offset);
    tmpVector.x = r * Math.sin(blob.theta) * Math.cos(blob.phi);
    tmpVector.y = r * Math.sin(blob.theta) * Math.sin(blob.phi);
    tmpVector.z = r * Math.cos(blob.theta);
    const s = 3.;
    const offset = Math.cos(t*Maf.TAU) * s;
    const strength = 2;
    const subtract = 10 + 20 * (.5 + .5 * noise.perlin3(s*tmpVector.x + 1.2*offset, s*tmpVector.y + .8 * offset, s*tmpVector.z + .9 * offset));
    effect.addBall(tmpVector.x+.5, tmpVector.y+.5, tmpVector.z+.5, strength, subtract);
  }

  mesh.geometry.dispose();
  mesh.geometry = effect.generateGeometry();

  mesh.material.opacity = t;
  mesh.rotation.z = t*Maf.TAU;
  mesh.rotation.x = t*Maf.TAU;

  const jitter = .01;
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
    0+Maf.randomInRange(-jitter,jitter),
    0+Maf.randomInRange(-jitter,jitter),
    6.5+Maf.randomInRange(-jitter,jitter),
  );

  renderer.render(scene, camera);

}

export { draw, loopDuration, canvas };
