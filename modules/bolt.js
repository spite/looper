import THREE from '../third_party/three.js';
import { BufferGeometryUtils } from '../third_party/THREE.BufferGeometryUtils.js';
import Maf from '../modules/maf.js';
import { Curves } from '../third_party/THREE.CurveExtras.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';

const boltMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: .9, roughness: .8, transparent: false });

function createBolt() {

  const piece = new THREE.Group();

  const path = new Curves.HelixCurve();
  const geometry = new THREE.TubeBufferGeometry(path, 500, 10, 18, false);

  const screw = new THREE.Mesh(geometry, boltMaterial);
  piece.add(screw);
  piece.castShadow = piece.receiveShadow = true;
  screw.position.z = 70;

  const rod = new THREE.Mesh(new THREE.CylinderBufferGeometry(1, 1, 5, 36), boltMaterial);
  piece.add(rod);
  rod.rotation.x = Math.PI / 2;
  rod.castShadow = rod.receiveShadow = true;
  rod.scale.setScalar(30);

  const top = new THREE.Mesh(new RoundedExtrudedPolygonGeometry(.5, .4, 6, 1, .05, .05, 4), boltMaterial);
  piece.add(top);
  top.position.z = -100;
  top.scale.setScalar(100);
  top.castShadow = top.receiveShadow = true;

  for (let j = 0; j < screw.geometry.attributes.position.array.length; j += 3) {
    const x = screw.geometry.attributes.position.array[j];
    const y = screw.geometry.attributes.position.array[j + 1];
    const z = screw.geometry.attributes.position.array[j + 2];
    const factor = .75 + z / 800;
    screw.geometry.attributes.position.array[j + 0] = x * factor;
    screw.geometry.attributes.position.array[j + 1] = y * factor;
  }
  screw.rotation.x = Math.PI;

  const tip = new THREE.Mesh(new THREE.CylinderBufferGeometry(0, 1, 1, 36), boltMaterial);
  piece.add(tip);
  tip.position.z = 90;
  tip.rotation.x = Math.PI / 2;
  tip.scale.setScalar(30);
  tip.castShadow = tip.receiveShadow = true;

  piece.scale.setScalar(.1);
  return piece;

}

export { createBolt, boltMaterial };