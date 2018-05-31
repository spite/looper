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
const mat = new THREE.MeshStandardMaterial();
const objects = [];
for (let y=0; y<20; y++) {
  for (let x=0; x<20; x++) {
    const mesh = new THREE.Mesh(
      geo,
      mat
    );
    mesh.scale.set(1,.5,2);
    mesh.position.set(.25*(x-9.5),.25*(y-9.5),0);
    mesh.receiveShadow = mesh.castShadow = true;
    group.add(mesh);
    objects.push({x,y,mesh});
  }
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

camera.position.set(0,0,8);
camera.lookAt(group.position);
renderer.setClearColor(0x101010,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;
  const t2 = ( t + .5 ) % 1;

  objects.forEach( o => {
    const p1 = o.mesh.position.clone();
    p1.multiplyScalar(-.05 + .1 * Maf.parabola(easings.InOutQuad(t),1));
    const c1 = curl(p1);
    c1.multiplyScalar(Maf.TAU);
    const p2 = o.mesh.position.clone();
    p2.multiplyScalar(-.05 + .1 * Maf.parabola(easings.InOutQuad(t2),1));
    const c2 = curl(p2);
    c2.multiplyScalar(Maf.TAU);
    const c = c1.add(c2);
    o.mesh.rotation.set(c.x,c.y,c.z);
  })

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
