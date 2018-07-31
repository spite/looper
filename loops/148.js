import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
import {palette2 as palette} from '../modules/floriandelooij.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const objects = [];

const RINGS = 36;
const OBJECTS = 6;
const geo = new RoundedBoxGeometry(1,3,3,.25,4);
const stickGeo = new RoundedBoxGeometry(2,2,2,.25,4);
const whiteMat = new THREE.MeshStandardMaterial({color: 0xfffffff, metalness: .1, roughness: .5});
const mats = [
  new THREE.MeshStandardMaterial({color: palette.range[2], metalness: .1, roughness: .5}),
  new THREE.MeshStandardMaterial({color: palette.range[0], metalness: .1, roughness: .5}),
  new THREE.MeshStandardMaterial({color: palette.range[4], metalness: .1, roughness: .5}),
  new THREE.MeshStandardMaterial({color: palette.range[6], metalness: .1, roughness: .5}),
  new THREE.MeshStandardMaterial({color: palette.range[1], metalness: .1, roughness: .5}),
  new THREE.MeshStandardMaterial({color: palette.range[3], metalness: .1, roughness: .5}),
];

for (let j=0; j<RINGS; j++) {
  const pivot = new THREE.Group();
  const meshes = [];
  const sticks = [];
  for (let k=0; k<OBJECTS; k++) {
    const mesh = new THREE.Mesh(geo,mats[k]);
    mesh.castShadow = mesh.receiveShadow = true;
    pivot.add(mesh);
    meshes.push(mesh);
  }
  for (let k=0; k<1; k++) {
    const mesh = new THREE.Mesh(stickGeo,whiteMat);
    mesh.castShadow = mesh.receiveShadow = true;
    pivot.add(mesh);
    sticks.push(mesh);
  }

  objects.push({meshes, sticks, pivot});
  group.add(pivot);
}
group.scale.setScalar(.75);
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

camera.position.set(0,0,8);
camera.lookAt(new THREE.Vector3(0,0,0));
camera.rotation.z = Math.PI;
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach( (o, id) => {
    const tt = Maf.mod(t,.25);
    const p = Math.floor(t*4);
    const a = id * Maf.TAU / objects.length;
    const r = 2 + .1 * Math.sin(easings.InOutQuad(t)*Maf.TAU);
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);

    o.pivot.position.set(x,y,0);
    o.pivot.rotation.z = a;
    o.pivot.rotation.x = .3 * Math.sin(t*Maf.TAU + id*Maf.TAU/RINGS);

    o.meshes.forEach( (m, mid) => {
      const a2 = id * Maf.TAU / RINGS + t * Maf.TAU + mid * Maf.TAU / 10;
      const r2 = .5;
      const x2 = r2 * Math.cos(a2);
      const y2 = r2 * Math.sin(a2);
      m.rotation.y = -a2;
      m.position.set(x2,0,y2);
      m.scale.setScalar(.06+.04*Math.sin(t*Maf.TAU+id*Maf.TAU/RINGS+mid*Maf.TAU/OBJECTS))
    })

    o.sticks.forEach( (m, mid) => {
      const a2 = id * Maf.TAU / RINGS + t * Maf.TAU;
      const r2 = .425 * Math.sin(t*Maf.TAU + id * Maf.TAU / RINGS);
      const x2 = r2 * Math.cos(a2);
      const y2 = r2 * Math.sin(a2);
      m.position.set(x2,0,y2);
      m.scale.setScalar(.06+.04*Math.sin(t*Maf.TAU+id*Maf.TAU/RINGS))
    })
  });


  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
