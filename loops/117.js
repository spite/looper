import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const whiteMaterial = new THREE.MeshStandardMaterial({color:0xffffff});
const blackMaterial = new THREE.MeshStandardMaterial({color:0x000000});

const MAX = 30;
const objects = [];
for (let j=0; j<MAX; j++) {
  const r = MAX-j;
  const h = 1 + .1*j;
  const mesh = new THREE.Mesh(
    new THREE.BoxBufferGeometry(r,h,r),
    (j%2)?blackMaterial:whiteMaterial
  );
  mesh.position.y = .5 * h;
  objects.push(mesh);
  mesh.receiveShadow = mesh.castShadow = true;
  group.add(mesh);
}
group.scale.setScalar(.25);
scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-1,1,1);
directionalLight.castShadow = true;
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight2.position.set(1,2,1);
directionalLight2.castShadow = true;
scene.add( directionalLight2 );

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight( 0xcefeff, 0xb3eaf0, .5 );
scene.add( light );

camera.position.set(10,15,0);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach( (o, id) => {
    o.position.x = .5 * id * Math.cos(2*t*Maf.TAU);
    o.position.z = .5 * id * Math.sin(2*t*Maf.TAU);
    o.rotation.y = (.5 + .5 * Math.sin(t*Maf.TAU) ) * .1 * id;
  });
  group.rotation.y = t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
