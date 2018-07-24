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
const material = new THREE.MeshStandardMaterial({color:0xb70000, metalness: .3, roughness: .2});
const geo = new RoundedExtrudedPolygonGeometry(1,.5,SIDES,1,.1,.25,5);

const RINGS = 20;
const OBJECTS = 10;
const RINGRADIUS = 10;
const SMALLRADIUS = 3;
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
  for (let j=0; j<OBJECTS; j++) {
    const mat = material.clone();
    mat.color.setHSL(i/RINGS,.75,.5);
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
    pivot.add(mesh);
    meshes.push({mesh,i,j,a:objectA});
  }
  group.add(pivot);
  objects.push({pivot});
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

const loopDuration = 1;
const cameraOffset = new THREE.Vector3();

function myXOR(a,b) {
  return ( a || b ) && !( a && b );
}

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach( (o, id) => {
    o.pivot.rotation.z = - t * Maf.TAU / OBJECTS + id;
  });
  meshes.forEach( (m, id) => {
    m.mesh.rotation.z = t * Maf.TAU / SIDES + m.i * Maf.TAU / (RINGS*SIDES);
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
