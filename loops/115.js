import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {Curves} from '../third_party/THREE.CurveExtras.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const whiteMaterial = new THREE.MeshStandardMaterial({color:0xaaaaaa, metalness: 0, roughness: .5});
const blackMaterial = new THREE.MeshStandardMaterial({color:0x000000, metalness: 0, roughness: .1});

for (let j=0; j<14; j++) {
  const r = 14-j;
  const h = 1 + .5*j;
  const mesh = new THREE.Mesh(
    new THREE.TorusBufferGeometry(r,1,36,200),
    (j%2)?blackMaterial:whiteMaterial
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.position.x = .75*j;
  if(j>6) {
    mesh.position.x = 12*.75 - .75*j;
  }
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

camera.position.set(0,15,0);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;
  group.rotation.y = 2*t * Maf.TAU;
  let f = 0;
  if (t<.5) {
    const tt = t/.5;
    f = .5 + .5 * Math.sin(-.5 *Maf.PI + tt*Maf.TAU);
  }
  group.rotation.z = Maf.mix(.25 * Maf.PI, .5 * Maf.PI, f);

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
