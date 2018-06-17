import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import createDominoPiece from '../modules/domino-piece.js';
import Maf from '../modules/maf.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const objects = [];

const PIECES = 32;
for (let j=0; j<PIECES; j++) {
  const base = new THREE.Group();
  const pivot = new THREE.Group();
  const piece = createDominoPiece(Math.round(Maf.randomInRange(0,6)),Math.round(Maf.randomInRange(0,6)));
  const a = j * Maf.TAU / PIECES;
  const r = 2;
  const x = r * Math.cos(a);
  const z = r * Math.sin(a);
  base.position.set(x,0,z);
  piece.position.set(0,.125,.5);
  base.rotation.set(0,-a,0);
  base.add(pivot);
  pivot.add(piece);
  group.add(base);

  const baseR = new THREE.Group();
  const pivotR = new THREE.Group();
  const pieceR = piece.clone();
  baseR.add(pivotR);
  pivotR.add(pieceR);
  group.add(baseR);
  baseR.position.set(x,-.1,z);
  pieceR.position.set(0,.125,.5);
  pieceR.scale.x = -1;
  baseR.rotation.set(0,-a,Maf.PI);

  objects.push({piece, pivot, pivotR});
}

group.scale.setScalar(.5);
scene.add(group);

const floor = new THREE.Mesh( new THREE.PlaneBufferGeometry(10,10), new THREE.MeshStandardMaterial({color: 0, opacity:.5, transparent:true}));
floor.receiveShadow = true;
floor.rotation.x = -Math.PI/2;
scene.add(floor);

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

camera.position.set(0,4,4);
camera.lookAt(0,0,0);
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time/loopDuration;

  objects.forEach( (o,i) => {
    o.pivot.rotation.x = - .5 * Math.PI + .25 * Math.PI * easings.InOutQuad(Maf.parabola(((1-t)+i/PIECES)%1,.5));
    o.pivotR.rotation.copy(o.pivot.rotation);
  });

  group.rotation.y = -t * Maf.TAU + Maf.PI;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
