import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const SIDES = 5;
const RINGS = 20;
const OBJECTS = 12;
const RINGRADIUS = 10;
const SMALLRADIUS = 4;

const whiteMaterial = new THREE.MeshStandardMaterial({color:0xffffff, metalness: .3, roughness: .2});
const redMaterial = new THREE.MeshStandardMaterial({color:0xb70000, metalness: .3, roughness: .2});
const blackMaterial = new THREE.MeshStandardMaterial({color:0xFF8000, metalness: .3, roughness: .2});
const geo1 = new RoundedExtrudedPolygonGeometry(.5,1,SIDES,1,.1,.25,5);
const geo2 = new RoundedExtrudedPolygonGeometry(.5,1,SIDES,1,.1,.25,5);
const torusGeo = new THREE.TorusBufferGeometry(SMALLRADIUS, .25, 36, 200);

const objects = [];
const meshes = [];

for (let i=0; i<RINGS; i++) {
  const pivot = new THREE.Group();
  const ringAngle = i*Maf.TAU/RINGS;
  const ringX = RINGRADIUS * Math.cos(ringAngle);
  const ringY = RINGRADIUS * Math.sin(ringAngle);
  pivot.position.set(ringX,ringY,0);
  pivot.rotation.x = Maf.PI / 2;
  pivot.rotation.y = ringAngle + Maf.PI / 8;
  const pivot2 = new THREE.Group();
  pivot.add(pivot2);
  const torus = new THREE.Mesh(torusGeo,blackMaterial);
  torus.castShadow = torus.receiveShadow = true;
  pivot2.rotation.x = .25 * Maf.PI;
  pivot2.rotation.z = .5;
  pivot2.add(torus);
  for (let j=0; j<OBJECTS; j++) {
    const geo = j % 2 ? geo1 : geo2;
    const mat = j % 2 ? whiteMaterial : redMaterial;
    const mesh = new THREE.Mesh(
      geo,
      mat
    );
    const objectA = j * Maf.TAU / OBJECTS;
    const objectX = SMALLRADIUS * Math.cos(objectA);
    const objectY = SMALLRADIUS * Math.sin(objectA);
    mesh.position.set(objectX, objectY, 0);
    mesh.receiveShadow = mesh.castShadow = true;
    mesh.rotation.x = Maf.PI / 2;
    mesh.rotation.y = objectA;
    mesh.rotation.z = Maf.PI / 4;
    pivot2.add(mesh);
    meshes.push({mesh,i,j,a:objectA});
  }
  group.add(pivot);
  objects.push({pivot, pivot2});
}
group.scale.setScalar(.1);
scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-2,2,2);
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

camera.position.set(0,0,5);
camera.lookAt(new THREE.Vector3(0,0,0));
camera.rotation.z = Math.PI;
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function myXOR(a,b) {
  return ( a || b ) && !( a && b );
}

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach( (o, id) => {
    const sign = (id % 2 ) ? 1: -1;
    o.pivot2.rotation.z = t * OBJECTS * Maf.TAU / OBJECTS + OBJECTS * id / Maf.TAU;
    o.pivot2.rotation.y = t * Maf.TAU + id * Maf.TAU / RINGS;
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
