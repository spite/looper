import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
import Maf from '../modules/maf.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();

// abuse the map uniform for the matcap
function getMaterial(color, roughness) {
  const map = new THREE.TextureLoader().load('./assets/matcap3.jpg');
  const material = new THREE.MeshStandardMaterial({color, metalness: .1, roughness});
  material.onBeforeCompile = (shader) =>{
    shader.uniforms.time = { value: 0 };
    shader.uniforms.matCap = { value: map };
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
uniform sampler2D matCap;
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `#include <map_fragment>`,
      `#include <map_fragment>

vec3 r = reflect( e, n );
float m = 2.82842712474619 * sqrt( r.z+1.0 );
vec2 vN = r.xy / m + .5;

float rim = max( 0., abs( dot( normalize( vNormal ), normalize( -vViewPosition ) ) ) );
rim = smoothstep( .25, .75, 1. - rim );

diffuseColor.rgb = texture2D(matCap, vN).rgb;
diffuseColor.rgb += vec3(.5*rim);
`);
  }
  return material;
}

const group = new THREE.Group();
const group1 = new THREE.Group();
const group2 = new THREE.Group();
const objects1 = [];
const objects2 = [];
const material = getMaterial(0x808080, .5);
const count = 40;
for (let j=0; j<count; j++) {
  const a = j * Maf.TAU / count;
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(.4,1.25,1.25,.1,5), material);
  mesh.castShadow = mesh.receiveShadow = true;
  const r = 2;
  const x = r * Math.cos(a);
  const y = 0;
  const z = r * Math.sin(a);
  const pivot = new THREE.Group();
  pivot.add(mesh);
  pivot.position.set(x,y,z);
  pivot.lookAt(scene.position);
  mesh.rotation.x = a;
  group1.add(pivot);
  objects1.push(mesh);
  const pivot2 = new THREE.Group();
  pivot2.position.set(x,y,z);
  pivot2.lookAt(scene.position);
  const mesh2 = mesh.clone();
  mesh2.rotation.x = a;
  pivot2.add(mesh2);
  group2.add(pivot2);
  objects2.push(mesh2);
}

group1.position.x = 0;
group2.position.x = 2;
group2.rotation.x = Math.PI / 2;

group.add(group1);
group.add(group2);

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
camera.position.set(0,6,0);
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

camera.target = new THREE.Vector3(0,0,0);

const loopDuration = 1;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  objects1.forEach( (o,id) => {
    o.rotation.x = id * Maf.TAU / objects1.length + t * Math.PI / 4;
  });
  objects2.forEach( (o,id) => {
    o.rotation.x = id * Maf.TAU / objects2.length + t * Math.PI / 4;
  });

  group1.rotation.y = t * Maf.PI / 4;
  group2.rotation.y = t * Maf.PI / 4;

  const jitter = 0.0;
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
    -2.5+Maf.randomInRange(-jitter,jitter),
    2.5+Maf.randomInRange(-jitter,jitter),
    2.5+Maf.randomInRange(-jitter,jitter),
  );
  camera.lookAt(camera.target);

  renderer.render(scene, camera);

}

export { draw, loopDuration, canvas };
