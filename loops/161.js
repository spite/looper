import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import {palette2 as palette} from '../modules/floriandelooij.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';

palette.range = ["#FFFFFF", "#FE2660", "#360896", "#69020C", "#090126", "#AE132D", "#EC6D95", "#EE95AB"];

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const rings = [];

const RINGS = 40;
const OBJECTS = 40;
const STEP = 5;

const l = Maf.TAU / OBJECTS;
const geo = new RoundedFlatTorus(10,5,10,.25,18,36,0,l,true);
const mat1 = new THREE.MeshStandardMaterial({color: palette.range[0], metalness: .1, roughness: .4});
const mat2 = new THREE.MeshStandardMaterial({color: palette.range[1], metalness: .1, roughness: .4});

for (let i=0; i<RINGS; i++) {
  const meshes = [];
  for (let j=0; j<OBJECTS; j++) {
    const mesh = new THREE.Mesh(geo, i%2?mat1:mat2);
    mesh.rotation.y = j * Maf.TAU / OBJECTS;
    mesh.position.y = i * STEP;
    group.add(mesh);
    meshes.push({mesh, y:mesh.position.y, a: mesh.rotation.y});
  }
  rings.push({meshes});
}
group.scale.setScalar(.05);
group.rotation.y = Maf.PI / OBJECTS;
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

const light = new THREE.HemisphereLight( palette.range[0], palette.range[1], .5 );
scene.add( light );

camera.position.set(0,10,.45);
camera.lookAt(new THREE.Vector3(0,0,-4));
renderer.setClearColor(palette.range[3],1);
scene.fog = new THREE.FogExp2(palette.range[3], 0.2 );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  rings.forEach( (ring, id) => {
    ring.meshes.forEach( (mesh, mid) => {
      const sign = mid % 2 ? 1 : -1;
      mesh.mesh.rotation.y = mesh.a + t * 8 * Maf.TAU / OBJECTS;
      mesh.mesh.position.y = mesh.y + sign * easings.InOutQuad(t) * 1 * STEP;
    });
  });
  group.position.y = .05 * 1*t*STEP;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
