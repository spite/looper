import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import {palette2 as palette} from '../modules/floriandelooij.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';

palette.range =  ["#FE9873", "#FDFCFB", "#EE6D52", "#CB322A", "#FAAD8F", "#390C11", "#FF8A3A"];

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const slices = [];
const slices2 = [];
const SLICES = 9;

const geo = new RoundedFlatTorus(1,4,2,.1,18,72/SLICES,0,Maf.TAU/SLICES, true);
const mat = new THREE.MeshStandardMaterial({color: palette.range[4], metalness: .01, roughness: .4});
for (let i=0; i<SLICES; i++) {
  const mesh = new THREE.Mesh(geo,mat);
  mesh.rotation.y = i * Maf.TAU / SLICES;
  mesh.castShadow = mesh.receiveShadow = true;
  slices.push(mesh);
  group.add(mesh);
}

const geo2 = new RoundedFlatTorus(2,4,4,.1,18,72/SLICES,0,Maf.TAU/SLICES, true);
const mat2 = new THREE.MeshStandardMaterial({color: palette.range[3], metalness: .01, roughness: .4});
for (let i=0; i<SLICES; i++) {
  const mesh = new THREE.Mesh(geo2,mat2);
  mesh.rotation.y = i * Maf.TAU / SLICES - Maf.TAU/16;
  mesh.castShadow = mesh.receiveShadow = true;
  slices2.push(mesh);
  group.add(mesh);
}

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
camera.rotation.z = Maf.TAU / 8;
renderer.setClearColor(palette.base[0],1);
scene.fog = new THREE.FogExp2(palette.range[3], 0.065 );
renderer.shadowMap.enabled = !true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;
 // group.rotation.x = t * Maf.TAU;

  const r = 1;
  slices.forEach( (s, id) => {
    const tt = easings.InOutQuad(Maf.mod(t, 1/SLICES) * SLICES);
    const tid = Math.floor(t * SLICES);
    if( id<tid ) {
      s.position.y = r;
    } else if ( id > tid ) {
      s.position.y = 0;
    } else {
      s.position.y = r * easings.OutBack(tt);
    }
  });

  slices2.forEach( (s, id) => {
    const tt = easings.InOutQuad(Maf.mod(t, 1/SLICES) * SLICES);
    const tid = Math.floor(t * SLICES);
    if( id<tid ) {
      s.position.y = r - .5;
    } else if ( id > tid ) {
      s.position.y = 0 - .5;
    } else {
      s.position.y = r * easings.OutBack(tt) - .5;
    }
  });

  group.position.y = -r * t + .5;
  group.rotation.y = t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
