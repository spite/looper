import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import createAkiraCapsule from '../modules/akira-capsule.js';
import Maf from '../modules/maf.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const objects = [];

const PIECES = 128;
for (let j=0; j<PIECES; j++) {
  const piece = createAkiraCapsule();
  piece.scale.setScalar(.25);
  const mx = Maf.randomInRange(-3,3);
  const my = Maf.randomInRange(-10,10);
  const mz = Maf.randomInRange(-3,3);
  piece.position.set(mx,my,mz);
  const rx = Maf.randomInRange(0, Maf.TAU);
  const ry = Maf.randomInRange(0, Maf.TAU);
  const rz = Maf.randomInRange(0, Maf.TAU);
  piece.rotation.set(rx,ry,rz);
  group.add(piece);
  const piece2 = piece.clone();
  piece2.position.y += 10;
  group.add(piece2);
  const sx = Math.round(Maf.randomInRange(-2,2));
  const sy = Math.round(Maf.randomInRange(-2,2));
  const sz = Math.round(Maf.randomInRange(-2,2));
  objects.push({piece,piece2,mx,my,mz,rx,ry,rz,sx,sy,sz});
}
group.scale.setScalar(.5);
scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-2,2,2);
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

camera.position.set(0,-4,6);
camera.lookAt(0,0,0);
renderer.setClearColor(0xdc3522,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.gammaOutput = true;
renderer.gammaFactor = 1.;

const loopDuration = 3;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time/loopDuration;

  const speed = 2;
  objects.forEach( (o,i) => {
    o.piece.position.y = o.my - 20 * speed * t;
    o.piece2.position.y = o.my + 20 - 20 * speed * t;
    if (o.piece.position.y < -20 ) {
      o.piece.position.y += 40;
    }
    if (o.piece2.position.y < -20 ) {
      o.piece2.position.y += 40;
    }
    o.piece.rotation.x = o.rx + o.sx * t * Maf.TAU;
    o.piece.rotation.y = o.ry + o.sy * t * Maf.TAU;
    o.piece.rotation.z = o.rz + o.sz * t * Maf.TAU;
    o.piece2.rotation.copy(o.piece.rotation);
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
