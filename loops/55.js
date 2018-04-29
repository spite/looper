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
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `#include <map_fragment>`,
      `#include <map_fragment>
vec3 r = reflect( e, n );
float m = 2.82842712474619 * sqrt( r.z+1.0 );
vec2 vN = r.xy / m + .5;

diffuseColor.rgb = texture2D(map, vN).rgb;
`);

  }
  return material;
}

const resolution = 50;
const effect = new MarchingCubes( resolution, new THREE.MeshBasicMaterial(), false, false );
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
