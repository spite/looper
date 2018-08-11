import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import {palette2 as palette} from '../modules/floriandelooij.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';

palette.range = ["#FFBE71", "#2A1510", "#FFD5A2", "#B73F2C", "#A98363", "#C4B4AA"];

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const meshes = [];
const RINGS = 36;
const mat = new THREE.MeshStandardMaterial({color: palette.range[2], metalness: .1, roughness: .4});
const mat2 = new THREE.MeshStandardMaterial({color: palette.range[3], metalness: .1, roughness: .4});
for (let j=0; j<RINGS; j++) {
  const l = .75;
  const geo = new RoundedFlatTorus(10,20,15,.25,18,36,0,l*Maf.PI,true);
  const mesh = new THREE.Mesh(geo,mat);
  mesh.castShadow = mesh.receiveShadow = true;
  const mesh2 = new THREE.Mesh(geo,mat2);
  mesh2.castShadow = mesh.receiveShadow = true;
  const pivot = new THREE.Group();
  const a = j * Maf.TAU / RINGS;
  pivot.rotation.z = Math.PI / 2;
  pivot.rotation.y = a;
  const r = 20;
  pivot.position.x = r * Math.sin(a);
  pivot.position.z = r * Math.cos(a);
  pivot.add(mesh);
  pivot.add(mesh2);
  group.add(pivot);
  meshes.push({mesh, mesh2});
}
group.scale.setScalar(.075);
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
renderer.setClearColor(palette.range[1],1);
scene.fog = new THREE.FogExp2(palette.range[1], 0.065 );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach( (m, id) => {
    const tt = t * Maf.TAU + id * Maf.TAU / RINGS;
    m.mesh.rotation.y = tt;
    m.mesh2.rotation.y = tt + Maf.PI;
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
