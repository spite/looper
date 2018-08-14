import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import {palette2 as palette} from '../modules/floriandelooij.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';

palette.range = ["#FF2000", "#FF5900", "#FE9100", "#FEFDFC", "#FEC194", "#FE9F5B"];

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const rings = [];

const RINGS = 20;
const OBJECTS = 20;
const STEP = 2.5;

const l = Maf.TAU / OBJECTS;
const geo = new RoundedFlatTorus(10,10,10,.25,18,36,0,l,true);
geo.center();
const mat1 = new THREE.MeshStandardMaterial({color: palette.range[3], metalness: .1, roughness: .4});
const mat2 = new THREE.MeshStandardMaterial({color: palette.range[1], metalness: .1, roughness: .4});

for (let i=0; i<RINGS; i++) {
  const meshes = [];
  for (let j=0; j<OBJECTS; j++) {
    const mesh = new THREE.Mesh(geo, i%2?mat1:mat2);
    const a = j * Maf.TAU / OBJECTS;
    const r = 9.5;
    mesh.rotation.y = -a + 1.4;
    mesh.position.x = r * Math.cos(a);
    mesh.position.y = .5 * RINGS * STEP - i * STEP;
    mesh.position.z = r * Math.sin(a);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    meshes.push({mesh, y:mesh.position.y, a: mesh.rotation.y});
  }
  rings.push({meshes});
}
group.position.y = -1;
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

const light = new THREE.HemisphereLight( palette.range[0], palette.range[1], .5 );
scene.add( light );

camera.position.set(0,8,8);
camera.lookAt(new THREE.Vector3(0,0,0));
camera.rotation.z = Maf.TAU / 8;
renderer.setClearColor(palette.range[2],1);
scene.fog = new THREE.FogExp2(palette.range[2], 0.05 );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  rings.forEach( (ring, id) => {
    ring.meshes.forEach( (mesh, mid) => {
      const sign = mid % 2 ? 1 : -1;
      mesh.mesh.scale.setScalar(Maf.parabola(Maf.mod(t+mid/OBJECTS-id/RINGS,1),2));
    });
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
