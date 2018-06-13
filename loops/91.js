import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';
import Maf from '../modules/maf.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const circle = new THREE.Group();

const objects = [];
const RINGS = 20;
for (let j=0; j<RINGS; j++) {
  const pivot = new THREE.Group();
  const geo = RoundedFlatTorus(.5*(1+j),2,4,.25);
  const material = new THREE.MeshStandardMaterial({metalness: .1, roughness: .1});
  material.color.setHSL(j/RINGS,.65,.5);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.rotation.y = Math.random() * Maf.TAU;
  mesh.rotation.x = Maf.randomInRange(-.1,.1);
  pivot.add(mesh);
  group.add(pivot);
  objects.push({pivot,mesh});
}
group.scale.setScalar(.5);
scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-8,8,8);
directionalLight.castShadow = true;
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight2.position.set(4,8,4);
directionalLight2.castShadow = true;
scene.add( directionalLight2 );

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight( 0xcefeff, 0xb3eaf0, .5 );
scene.add( light );

camera.position.set(0,6,6);
camera.lookAt(0,0,1);
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time/loopDuration;

  objects.forEach( (o,i) => {
    o.pivot.position.y = 1 * Math.sin(t*Maf.TAU+.5*i);
  });

  group.rotation.y = t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
