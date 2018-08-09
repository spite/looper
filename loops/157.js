import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import {palette2 as palette} from '../modules/floriandelooij.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';

palette.range =  ["#DAA14B", "#6A2A10", "#D26A1B", "#D88038", "#AB4F12", "#7E4019","#FFE38E", "#FDD47F", "#FEB776", "#FFFFEB", "#B1512D", "#642615", ""];

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const meshes = [];
const rings = [];
const RINGS = 10;
for (let j=0; j<RINGS; j++) {
  const r = j + 5;
  const STEPS = 2 * r;
  const ring = new THREE.Group();
  rings.push(ring);
  group.add(ring);
  ring.rotation.y = Maf.randomInRange(0,Maf.TAU);
  const l = Maf.TAU / STEPS;
  const geo = new RoundedFlatTorus(2*r,8,80 - j * 5,.25,18,9,0,l,true);
  for (let i=0; i<STEPS; i++) {
    const a = i * Maf.TAU / STEPS;
    const lc = palette.range.length;
    const color = palette.range[Math.floor(Math.random()*lc)];
    const mat = new THREE.MeshStandardMaterial({wireframe: !true,color, metalness: .1, roughness: .4});
    const mesh = new THREE.Mesh(geo,mat);
    mesh.position.y = Maf.randomInRange(0,0);
    mesh.rotation.y = a;
    mesh.castShadow = mesh.receiveShadow = true;
    const distance = r;
    const offset = Maf.randomInRange(0,Maf.TAU);
    meshes.push({mesh,distance,offset});
    ring.add(mesh);
  }
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

camera.position.set(0,8,8);
camera.lookAt(new THREE.Vector3(0,0,0));
renderer.setClearColor(palette.range[5],1);
scene.fog = new THREE.FogExp2(palette.range[5], 0.065 );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  rings.forEach( (r,id) => {
    const sign = (id%2)?1:-1;
    r.rotation.y = sign * t * Maf.TAU;
  })
  meshes.forEach( (m,id) => {
    m.mesh.position.y = (30 - 2*m.distance) * Math.sin(t*Maf.TAU+m.offset);
  })
  group.rotation.z = ( Maf.TAU / 32 ) * Math.sin(t*Maf.TAU);

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
