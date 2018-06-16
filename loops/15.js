import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import noise from '../third_party/perlin.js';
import Maf from '../modules/maf.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const material = new THREE.MeshStandardMaterial({color: 0x808080, metalness: 0, roughness: .1});
const geometry = new THREE.IcosahedronBufferGeometry(1,3);

const SIZE = 4;
const bubbles = [];
for (let y=0; y<SIZE; y++) {
  for (let x=0; x<SIZE; x++) {
    for (let j=0; j<20; j++) {
      const mesh = new THREE.Mesh(geometry,material.clone());
      const px = Maf.randomInRange(-SIZE, SIZE);
      const py = Maf.randomInRange(-SIZE, SIZE);
      const pz = Maf.randomInRange(-SIZE, SIZE);
      mesh.position.set(px,py,pz);
      bubbles.push({mesh,x,y,offset:Math.random()});
      group.add(mesh);
      mesh.castShadow = mesh.receiveShadow = true;
    }
  }
}

scene.add(group);
group.rotation.z = Math.PI / 2;

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

camera.position.set(5.5,8,5.5);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

const s = 4;
const DEPTH = 5;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  bubbles.forEach( c => {
    const t = (( time + c.offset * loopDuration ) % loopDuration ) / loopDuration;
    c.mesh.position.x = .5 -.5 * DEPTH + t * DEPTH;
    const n = .25 + .25 * (noise.perlin3(s*t,s*c.mesh.position.y,s*c.mesh.position.z));
    const tz = ( c.mesh.position.z + .5 * SIZE ) / SIZE;
    const finalScale = 1.5 * Maf.parabola(t,1)*n;
    c.mesh.material.color.setHSL(.5 + .25 * finalScale,.4 + .1 * tz,.4 + .1 * tz)
    c.mesh.scale.setScalar(finalScale);
  })
  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
