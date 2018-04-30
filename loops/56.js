import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {MarchingCubes} from '../third_party/THREE.MarchingCubes.js';
import Maf from '../modules/maf.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

// abuse the map uniform for the matcap
function getMaterial(color, roughness) {
  const map = new THREE.TextureLoader().load('./assets/LitSphere_test_04.jpg');
  const material = new THREE.MeshStandardMaterial({color, metalness: .1, roughness, map});
  material.onBeforeCompile = (shader) =>{
    shader.vertexShader = shader.vertexShader.replace(
      `varying vec3 vViewPosition;`,
      `varying vec3 vViewPosition;
varying vec3 e;
varying vec3 n;`);
    shader.vertexShader = shader.vertexShader.replace(
      `#include <defaultnormal_vertex>`,
      `#include <defaultnormal_vertex>
e = normalize( vec3( modelViewMatrix * vec4( position, 1.0 ) ) );
n = normalize( normalMatrix * normal );
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `varying vec3 vViewPosition;`,
      `varying vec3 vViewPosition;
varying vec3 e;
varying vec3 n;

vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy ) {
  vec3 vSigmaX = dFdx( surf_pos );
  vec3 vSigmaY = dFdy( surf_pos );
  vec3 vN = surf_norm;    // normalized
  vec3 R1 = cross( vSigmaY, vN );
  vec3 R2 = cross( vN, vSigmaX );
  float fDet = dot( vSigmaX, R1 );
  vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
  return normalize( abs( fDet ) * surf_norm - vGrad );
}
#define M_PI 3.1415926535897932384626433832795

float pattern(float v, float v2) {
    return smoothstep( .45, .55, .5 + .5 * sin( 5. * 2. * M_PI * v ) );
}

vec3 vividLight(vec3 src, vec3 dst) {
  return vec3((src.x <= 0.5) ? (1.0 - (1.0 - dst.x) / (2.0 * src.x)) : (dst.x / (2.0 * (1.0 - src.x))),
      (src.y <= 0.5) ? (1.0 - (1.0 - dst.y) / (2.0 * src.y)) : (dst.y / (2.0 * (1.0 - src.y))),
      (src.z <= 0.5) ? (1.0 - (1.0 - dst.z) / (2.0 * src.z)) : (dst.z / (2.0 * (1.0 - src.z))));

}
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `#include <map_fragment>`,
      `#include <map_fragment>

float strip = pattern(vUv.y, vUv.x);
float stripOffset = pattern(vUv.y-.0025, vUv.x)-strip;

vec3 n2 = n + vec3( 0., stripOffset, 0. );

vec3 r = reflect( e, n2 );
float m = 2.82842712474619 * sqrt( r.z+1.0 );
vec2 vN = r.xy / m + .5;

vec3 Blend = texture2D(map, vN).rgb;
vec3 Target = vec3(mix(.65,0.35,1.-strip));

diffuseColor.rgb = vividLight(Blend, Target);
`);

    shader.fragmentShader = `#extension GL_OES_standard_derivatives : enable
    ${shader.fragmentShader}`;

  }
  return material;
}

const resolution = 50;
const effect = new MarchingCubes( resolution, new THREE.MeshBasicMaterial(), true, false );
effect.position.set(0,0,0);
effect.init( resolution );

const material = getMaterial(0x808080, .5);
const mesh = new THREE.Mesh(effect.generateBufferGeometry(), material);
mesh.castShadow = mesh.receiveShadow = true;
mesh.scale.setScalar(6);
group.add(mesh);

scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-1,1,1);
const r = 7;
directionalLight.shadow.camera.near = -2;
directionalLight.shadow.camera.far = 10;
directionalLight.shadow.camera.left = -r;
directionalLight.shadow.camera.right = r;
directionalLight.shadow.camera.top = r;
directionalLight.shadow.camera.bottom = -r;
directionalLight.shadow.camera.updateProjectionMatrix();
directionalLight.castShadow = true;
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight2.position.set(1,2,1);
directionalLight2.shadow.camera.near = -2;
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

const loopDuration = 6;
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

  const isolation = 800 + 200 * Math.cos(4.*t*Maf.TAU);
  effect.isolation = isolation;
  effect.reset();

  const radius = .3;
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
  }

  mesh.geometry.dispose();
  mesh.geometry = effect.generateBufferGeometry();

  group.rotation.z = t*Maf.TAU;
  group.rotation.y = t*Maf.TAU;

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
