import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

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

camera.position.set(0,20,0);
camera.lookAt(group.position);
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const geometry = new THREE.BoxBufferGeometry(.5,.15,.5);
const material = new THREE.MeshStandardMaterial({color:0xffffff, wireframe: !true});

const LINES = 200;
const r = 5;
const lines = [];
for (let a=0; a<2*Maf.TAU; a+=2*Maf.TAU/LINES) {
  const mesh = new THREE.Mesh(geometry, material);
  const x = r * Math.cos(a);
  const z = r * Math.sin(a);
  mesh.position.set(x,0,z);
  mesh.rotation.x = -Maf.PI/2;
  mesh.rotation.z = -a;
  mesh.castShadow = mesh.receiveShadow = true;
  group.add(mesh);
  lines.push({mesh, angle:a, idx:lines.length});
}

scene.add(group);

const loopDuration = 4;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  const radius = 5;
  lines.forEach( l => {
    const a = l.angle;
    const offset = (l.idx%2)?time*Maf.TAU/loopDuration:Maf.PI+time*Maf.TAU/loopDuration;
    const r = 3 + 2 * Math.cos(a+offset);
    const x = r * Math.cos(a);
    const z = r * Math.sin(a);
    l.mesh.scale.x = .25 * (6 - r);
    l.mesh.position.set(x,0,z);
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
