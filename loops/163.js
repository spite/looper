import THREE from '../third_party/three.js';
import {renderer, getCamera, getOrthoCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import {palette2 as palette} from '../modules/floriandelooij.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';

palette.range = ["#F99B62", "#E32814", "#EDC696", "#FAF9F8", "#DD5732", "#2F0C0F", "#FBC66E", "#7A738B"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(3,3);
const scene = new THREE.Scene();
const group = new THREE.Group();
const rings = [];

const RINGS = 20;
const RADIUS = 10;
const STEP = 1.2;

const mat1 = new THREE.MeshStandardMaterial({color: palette.range[3], metalness: .1, roughness: .4});
const mat2 = new THREE.MeshStandardMaterial({color: palette.range[1], metalness: .1, roughness: .4});

for (let i=0; i<RINGS; i++) {
  const r = Maf.parabola(Maf.mod(i/RINGS,1),1) * RADIUS;
  const OBJECTS = Math.round(( 2 * Maf.TAU * r ) / 2);
  const l = Maf.TAU / OBJECTS;
  const diff = Math.abs( r - Maf.parabola(Maf.mod((i-1)/RINGS,1),1) * RADIUS );
  const geo = new RoundedFlatTorus(r,5,5*STEP,.25,18,9,0,l,true);
  const m = new THREE.Matrix4();
  m.makeTranslation(0,0,-r);
  geo.applyMatrix(m);
  const meshes = [];
  for (let j=0; j<OBJECTS; j++) {
    const pivot = new THREE.Mesh();
    const mesh = new THREE.Mesh(geo, i%2?mat1:mat2);
    const a = j * Maf.TAU / OBJECTS;
    pivot.rotation.y = -a + Math.PI/2;
    pivot.position.x = r * Math.cos(a);
    pivot.position.y = .5 * RINGS * STEP - i * STEP;
    pivot.position.z = r * Math.sin(a);
    pivot.add(mesh);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(pivot);
    meshes.push({mesh, y:mesh.position.y, a: mesh.rotation.y});
  }
  rings.push({meshes});
}
group.scale.setScalar(.25);
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

const loopDuration = 3;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  rings.forEach( (ring, id) => {
    ring.meshes.forEach( (mesh, mid) => {
      const s = Maf.parabola(Maf.mod(t+mid/ring.meshes.length-id/RINGS,1),2);
      mesh.mesh.scale.setScalar(s);
      mesh.mesh.visible = s > .001;
    });
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
