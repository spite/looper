import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
import noise from '../third_party/perlin.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const material = new THREE.MeshStandardMaterial({color: 0x808080, metalness: 0, roughness: .1});
const geometry = new RoundedBoxGeometry(1,1,1,.1,2);

const SIZE = 4;
const cubes = [];
for (let y=0; y<SIZE; y++) {
  for (let x=0; x<SIZE; x++) {
    for (let j=0; j<10; j++) {
      const mesh = new THREE.Mesh(geometry,material.clone());
      mesh.position.set(-.5*SIZE,y-.5*SIZE,x-.5*SIZE);
      mesh.position.z += 1;
      cubes.push({mesh,x,y,offset:Math.random()});
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

function parabola( x, k ) {
  return Math.pow( 4 * x * ( 1 - x ), k );
}

const s = 4;
const DEPTH = 5;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  cubes.forEach( c => {
    const t = (( time + c.offset * loopDuration ) % loopDuration ) / loopDuration;
    c.mesh.position.x = .5 -.5 * DEPTH + t * DEPTH;
    const n = .25 + .25 * (noise.perlin3(s*t,s*c.mesh.position.y,s*c.mesh.position.z));
    const tz = ( c.mesh.position.z + .5 * SIZE ) / SIZE;
    const finalScale = 1.5 * parabola(t,1)*n;
    c.mesh.material.color.setHSL(.5 + .5 * finalScale,.4 + .2 * tz,.4 + .2 * tz)
    c.mesh.scale.setScalar(finalScale);
  })
  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
