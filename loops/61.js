import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import pointOnSphere from '../modules/points-sphere.js';

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

const pivot = new THREE.Group();
const group = new THREE.Group();
const material = getMaterial(0x808080, .5);
const mesh = new THREE.Mesh(new RoundedBoxGeometry(1,1,1,.1,5), material);
mesh.castShadow = mesh.receiveShadow = true;
pivot.add(mesh);
group.add(pivot);
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
camera.position.set(0,0,7);
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

camera.target = new THREE.Vector3(0,0,0);
camera.lookAt(scene.position);

const whiteMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, emissive: 0xffffff});
const bar1 = new THREE.Mesh(new THREE.BoxBufferGeometry(.25,100,.25), whiteMaterial);
bar1.position.x = 2.5;
scene.add(bar1);
const bar2 = new THREE.Mesh(new THREE.BoxBufferGeometry(.25,100,.25), whiteMaterial);
bar2.position.x = -2.5;
scene.add(bar2);

const loopDuration = 2;
const spherePoints = pointOnSphere(64);

let frame = 0;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  if (t<.75) {
    const tt = t /.75;
    group.position.z = 4 + 1.75 * easings.OutBounce(easings.OutQuint(tt));
    group.rotation.x = tt*Maf.PI/2;
    group.rotation.y = easings.InOutQuad(tt)*Maf.PI;
  } else {
    const tt = (t-.75)/.25;
    group.position.z = 5.75 - 1.75 * easings.InOutQuint(tt);
  }

  /*const jitter = 0.01;
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

  frame++;
  frame %= 64;
  pivot.position.copy(spherePoints[frame]).multiplyScalar(jitter);*/

  renderer.render(scene, camera);

}

export { draw, loopDuration, canvas };
