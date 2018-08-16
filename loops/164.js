import THREE from '../third_party/three.js';
import {renderer, getCamera, getOrthoCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import {palette2 as palette} from '../modules/floriandelooij.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';

palette.range = ["#0C6DB2", "#26909B", "#A1D6E9", "#FCFEFE", "#54AAD3"]

const canvas = renderer.domElement;
const camera = getOrthoCamera(3,3);
const scene = new THREE.Scene();
const group = new THREE.Group();
const rings = [];

const RINGS = 15;
const OBJECTS = 6;
const STEP = 1.75;

const l = .75 * Maf.TAU / OBJECTS;
const geo = new RoundedFlatTorus(10,10,10,.25,18,36,0,l,true);
const m = new THREE.Matrix4();
m.makeTranslation(-10*Math.sin(.5*l),0,-10*Math.cos(.5*l));
geo.applyMatrix(m);
const mat1 = new THREE.MeshStandardMaterial({color: palette.range[4], metalness: .1, roughness: .4});
const mat2 = new THREE.MeshStandardMaterial({color: palette.range[3], metalness: .1, roughness: .4});

for (let i=0; i<RINGS; i++) {
  const meshes = [];
  const ring = new THREE.Group();
  ring.position.y = .5 * RINGS * STEP - i * STEP;
  group.add(ring);
  for (let j=0; j<OBJECTS; j++) {
    const pivot = new THREE.Mesh();
    const mesh = new THREE.Mesh(geo, i%2?mat1:mat2);
    const a = j * Maf.TAU / OBJECTS;
    const r = 10;
    pivot.rotation.y = -a + Math.PI/2 - Math.PI/8 - Math.PI / 32 - Math.PI / 64;
    pivot.position.x = r * Math.cos(a);
    pivot.position.y = 0;
    pivot.position.z = r * Math.sin(a);
    pivot.add(mesh);
    mesh.castShadow = mesh.receiveShadow = true;
    ring.add(pivot);
    meshes.push({mesh, pivot, y:mesh.position.y, a: mesh.rotation.y});
  }
  rings.push({ring,meshes});
}
//group.position.y = -1;
group.scale.setScalar(.15);
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

const light = new THREE.HemisphereLight( palette.range[1], palette.range[1], .5 );
scene.add( light );

camera.position.set(0,8,8);
camera.lookAt(new THREE.Vector3(0,0,0));
camera.rotation.z = Maf.TAU / 8;
renderer.setClearColor(palette.range[4],1);
scene.fog = new THREE.FogExp2(palette.range[4], 0.05 );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  rings.forEach( (ring, id) => {
    ring.ring.rotation.y = t * Maf.TAU / OBJECTS - id * (Maf.TAU/OBJECTS) / RINGS;
    ring.meshes.forEach( (mesh, mid) => {
      mesh.mesh.scale.setScalar(Maf.parabola(Maf.mod(t+id/RINGS+0*mid/ring.meshes.length,1),2));
    });
  });
  group.rotation.y = t * Maf.TAU / OBJECTS;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
