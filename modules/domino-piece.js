import THREE from '../third_party/three.js';
import Maf from '../modules/maf.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';

const geo = new RoundedBoxGeometry(.5,.25,1,.05,5);
const material = new THREE.MeshStandardMaterial({color: 0xdedede, metalness: .1, roughness: 0});
const metalMaterial = new THREE.MeshStandardMaterial({color: 0x404040, metalness: .5, roughness: 0});
const lineGeo = new RoundedBoxGeometry(.5,.1,.1,.05,5);
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

function createDominoPiece(numberTop, numberBottom) {

  const piece = new THREE.Group();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = mesh.receiveShadow = true;
  piece.add(mesh);
  const lineMesh = new THREE.Mesh(lineGeo, metalMaterial);
  lineMesh.castShadow = lineMesh.receiveShadow = true;
  lineMesh.position.set(0,.09,0);
  piece.add(lineMesh);
  addPegs(numberTop, piece, true);
  addPegs(numberBottom, piece, false);

  return piece;

}

export default createDominoPiece;
