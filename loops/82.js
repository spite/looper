import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import {curl} from '../modules/curl.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const geo = new THREE.IcosahedronBufferGeometry(.1,3);
const mat = new THREE.MeshStandardMaterial({metalness:.1,roughness: .25});

const objects = [];
const COUNT = 1000;
for (let j=0; j<COUNT; j++) {
  const t = j* Maf.TAU / COUNT;
  const r = .5;
  const x = r * Math.cos(5*t) + r * Math.cos(4*t);
  const y = r * Math.sin(5*t) + r * Math.sin(t);
  const z = 2*r * Math.sin(2*t);
  const mesh = new THREE.Mesh(
    geo,
    mat.clone()
  );
  mesh.material.color.setHSL(j/COUNT,.5,.5);
  mesh.position.set(x,y,z);
  mesh.receiveShadow = mesh.castShadow = true;
  objects.push({mesh,x,y,z});
  group.add(mesh);
}

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

camera.position.set(4,4,4);
camera.lookAt(group.position);
renderer.setClearColor(0x101010,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;
  const t2 = ( t + .5 ) % 1;

  objects.forEach( (o,i) => {
    const s = .5 + .5 * Math.sin(i*10*Maf.TAU/objects.length + t*4*Maf.TAU);
    o.mesh.position.set(o.x,o.y,o.z);
    o.mesh.position.multiplyScalar(.5+.5*s);
    o.mesh.scale.setScalar(1+s);
  });

  group.rotation.x = t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
