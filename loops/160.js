import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import {palette2 as palette} from '../modules/floriandelooij.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';

palette.range = ["#F05403", "#E83704", "#FE8C01", "#FFFEFC", "#FCD3A2", "#FAAF5F"];

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const meshes = [];
const RINGS = 36;
const SIDES = 12;
const mats = [];
palette.range.forEach( (c) => {
  mats.push(new THREE.MeshStandardMaterial({color: c, metalness: .1, roughness: .4}));
});
const l = Maf.TAU / SIDES;
const geo = new RoundedFlatTorus(10,10,20,.25,18,36,0,l,true);
for (let j=0; j<RINGS; j++) {
  const pivot = new THREE.Group();
  const a = j * Maf.TAU / RINGS;
  pivot.rotation.z = Math.PI / 2;
  pivot.rotation.y = a;
  const offset = Maf.randomInRange(0,Maf.TAU);
  const base = new THREE.Group();
  pivot.add(base);
  for (let k=0; k<SIDES; k++) {
    const a = k * Maf.TAU / SIDES;
    const mesh = new THREE.Mesh(geo,mats[Math.floor(Math.random()*palette.range.length)]);
    mesh.rotation.y = a;
    mesh.castShadow = mesh.receiveShadow = true;
    base.add(mesh);
  }
  group.add(pivot);
  meshes.push({offset,pivot,base,a});
}
group.scale.setScalar(.05);
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

const light = new THREE.HemisphereLight( palette.range[2], palette.range[0], .5 );
scene.add( light );

camera.position.set(0,8,0);
camera.lookAt(new THREE.Vector3(0,0,0));
camera.rotation.z = Maf.PI / 4;
renderer.setClearColor(0x433C35,1);
scene.fog = new THREE.FogExp2(0x433C35, 0.05 );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach( (m, id) => {
    const r = 25 + 5 * easings.InQuad(Maf.parabola(Maf.mod(2*t,1),4)) * Math.sin(t*Maf.TAU + m.offset);
    m.pivot.position.x = r * Math.sin(m.a);
    m.pivot.position.z = r * Math.cos(m.a);
    m.pivot.rotation.x = .05*(r-20);
    const tt = t * Maf.TAU + 2 * id * Maf.TAU / RINGS;
    m.base.rotation.y = tt;
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
