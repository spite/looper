import THREE from '../third_party/three.js';
import {BufferGeometryUtils} from '../third_party/THREE.BufferGeometryUtils.js';
import Maf from '../modules/maf.js';

const whiteMaterial = new THREE.MeshStandardMaterial({color: 0xff95a7, metalness: 0, roughness: 0, transparent: true});
const borderMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.BackSide, depthWrite: false});
const redMaterial = new THREE.MeshStandardMaterial({color: 0x4060a6, metalness: 0, roughness: .2, transparent: true});

function createAkiraCapsule() {

  // for random colored capsule
  //  const redMaterial = new THREE.MeshStandardMaterial({color: 0xb70000, metalness: 0, roughness: .2, transparent: true});
  //  redMaterial.color.setHSL(Maf.randomInRange(0,1),.75,.5);

  const piece = new THREE.Group();
  const border = .1;
  const SEGMENTS = 9;

  // Red side

  const bottom = new THREE.SphereBufferGeometry(1, 2*SEGMENTS, SEGMENTS, 0, Maf.TAU, 0, .5*Maf.PI);
  const m1 = new THREE.Matrix4().makeRotationX(Maf.PI);
  const m2 = new THREE.Matrix4().makeTranslation(0,-2,0);
  bottom.applyMatrix(m1).applyMatrix(m2);

  const cylinderBottom = new THREE.CylinderBufferGeometry(1,1,2,2*SEGMENTS,1,true)
  const m3 = new THREE.Matrix4().makeTranslation(0,-1,0);
  cylinderBottom.applyMatrix(m3);

  const redGeometry = BufferGeometryUtils.mergeBufferGeometries([bottom,cylinderBottom]);
  const redSide = new THREE.Mesh(redGeometry, redMaterial);
  redSide.castShadow = redSide.receiveShadow = true;
  piece.add(redSide);

  // White side

  const top = new THREE.SphereBufferGeometry(1, 2*SEGMENTS, SEGMENTS, 0, Maf.TAU, 0, .5*Maf.PI);
  const m4 = new THREE.Matrix4().makeTranslation(0,2,0);
  top.applyMatrix(m4);

  const cylinderTop = new THREE.CylinderBufferGeometry(1,1,2,2*SEGMENTS,1,true);
  const m5 = new THREE.Matrix4().makeTranslation(0,1,0);
  cylinderTop.applyMatrix(m5);

  const whiteGeometry = BufferGeometryUtils.mergeBufferGeometries([top,cylinderTop]);
  const whiteSide = new THREE.Mesh(whiteGeometry, whiteMaterial);
  whiteSide.castShadow = whiteSide.receiveShadow = true;
  piece.add(whiteSide);

  // Border

  /*const topStroke = new THREE.SphereBufferGeometry(1+border, 2*SEGMENTS, SEGMENTS, 0, Maf.TAU, 0, .5*Maf.PI);
  topStroke.applyMatrix(m4);

  const bottomStroke = new THREE.SphereBufferGeometry(1+border, 2*SEGMENTS, SEGMENTS, 0, Maf.TAU, 0, .5*Maf.PI);
  bottomStroke.applyMatrix(m1).applyMatrix(m2);

  const cylinderTopStroke = new THREE.CylinderBufferGeometry(1+border,1+border,2,2*SEGMENTS,1,true);
  cylinderTopStroke.applyMatrix(m5);

  const cylinderBottomStroke = new THREE.CylinderBufferGeometry(1+border,1+border,2,2*SEGMENTS,1,true);
  cylinderBottomStroke.applyMatrix(m3);

  const borderGeometry = BufferGeometryUtils.mergeBufferGeometries([topStroke,cylinderTopStroke,cylinderBottomStroke,bottomStroke]);
  const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
  piece.add(borderMesh);*/

  return piece;

}

export default createAkiraCapsule;
