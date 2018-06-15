import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
import Maf from '../modules/maf.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const objects = [];
const r = .5;
const geo = new RoundedBoxGeometry(r,.5*r,2*r,.05,5);
const material = new THREE.MeshStandardMaterial({color: 0xdedede, metalness: .1, roughness: 0});
const metalMaterial = new THREE.MeshStandardMaterial({color: 0x404040, metalness: .5, roughness: 0});
const lineGeo = new RoundedBoxGeometry(r,.1,.1,.05,5);
const pegGeo = new THREE.IcosahedronGeometry(.05,3);

function addPegs(num, piece, top) {
  const pegs = [
    '000000000',
    '0000x0000',
    '00x000x00',
    '00x0x0x00',
    'x0x000x0x',
    'x0x0x0x0x',
    'x0xx0xx0x'
  ];
  let ptr = 0;
  const conf = pegs[num];
  for (let y=0; y<3; y++) {
    for (let x=0; x<3; x++) {
      if (conf[ptr] === 'x') {
        const mesh = new THREE.Mesh(pegGeo, metalMaterial);
        mesh.position.set(.1*(x-1),.1,.1*(y-1) + (top?.25:-.25));
        mesh.castShadow = mesh.receiveShadow = true;
        piece.add(mesh);
      }
      ptr++;
    }
  }
}

const CUBES = 32;
const RINGS = 6;
for (let j=0; j<RINGS; j++) {
  const pivot = new THREE.Group();
  const r = 3;
  const a = j * Maf.TAU / RINGS;
  const x = r * Math.cos(a);
  const y = r * Math.sin(a);
  const z = 0;
  pivot.position.set(x,y,z);
  pivot.lookAt(scene.position);
  const offset = j % 2;
  for (let i=0; i<CUBES; i+=2) {
    const piece = new THREE.Group();
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = mesh.receiveShadow = true;
    const ma = ( i+offset ) * Maf.TAU / CUBES;
    const mr = 1.5;
    const mx = mr * Math.cos(ma);
    const my = mr * Math.sin(ma);
    const mz = 0;
    piece.position.set(mx,my,mz);
    piece.rotation.z = ma;
    piece.add(mesh);
    const lineMesh = new THREE.Mesh(lineGeo, metalMaterial);
    lineMesh.castShadow = lineMesh.receiveShadow = true;
    lineMesh.position.set(0,.09,0);
    piece.add(lineMesh);
    pivot.add(piece);
    addPegs(Math.round(Maf.randomInRange(0,6)), piece, true);
    addPegs(Math.round(Maf.randomInRange(0,6)), piece, false);
  }
  group.add(pivot);
  objects.push({pivot});
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

camera.position.set(0,6,6);
camera.lookAt(0,0,0);
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time/loopDuration;

  objects.forEach( (o,i) => {
    o.pivot.rotation.z = (i%2?-1:1) * t * Maf.TAU;
  });

  group.rotation.y = t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
