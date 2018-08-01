import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
import {palette2 as palette} from '../modules/floriandelooij.js';

palette.range = ["#D4E6E0", "#EE720A", "#557E86", "#9E650F", "#475B4F", "#D8B85B"]
const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const objects = [];

const RINGS = 50;
const OBJECTS = 2;
const geo = new RoundedBoxGeometry(.25,.25,.25,.025,4);
const stickGeo = new RoundedBoxGeometry(.025,.025,1,.025,4);
const centerGeo = new THREE.CylinderBufferGeometry(.125,.125,.5,36);
const whiteMat = new THREE.MeshStandardMaterial({color: 0xfffffff, metalness: .1, roughness: .5});
const mats = [
  new THREE.MeshStandardMaterial({color: palette.range[2], metalness: .1, roughness: .25}),
  new THREE.MeshStandardMaterial({color: palette.range[1], metalness: .1, roughness: .25}),
  new THREE.MeshStandardMaterial({color: palette.range[2], metalness: .1, roughness: .25}),
  new THREE.MeshStandardMaterial({color: palette.range[3], metalness: .1, roughness: .25}),
  new THREE.MeshStandardMaterial({color: palette.range[4], metalness: .1, roughness: .25}),
  new THREE.MeshStandardMaterial({color: palette.range[5], metalness: .1, roughness: .25}),
];

for (let j=0; j<RINGS; j++) {
  const pivot = new THREE.Group();
  const meshes = [];
  const centers = [];

  for (let k=0; k<OBJECTS; k++) {
    const mesh = new THREE.Mesh(geo,mats[k]);
    mesh.castShadow = mesh.receiveShadow = true;
    pivot.add(mesh);
    meshes.push(mesh);
  }
  const stick = new THREE.Mesh(stickGeo,mats[4]);
  stick.castShadow = stick.receiveShadow = true;
  pivot.add(stick);

  const center = new THREE.Mesh(centerGeo,mats[5]);
  center.castShadow = center.receiveShadow = true;
  center.scale.setScalar(.5);
  pivot.add(center);

  objects.push({meshes, stick, center, pivot});
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
renderer.setClearColor(palette.base[0],1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach( (o, id) => {
    const tt = Maf.mod(t,.25);
    const p = Math.floor(t*4);
    const a = id * Maf.TAU / objects.length;
    const r = 2;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);

    o.pivot.position.set(x,y,0);
    o.pivot.rotation.z = a;

    const RUNS = 2;
    const TWISTS = 3;

    o.meshes.forEach( (m, mid) => {
      const a2 = TWISTS*id * Maf.TAU / RINGS + t * Maf.TAU + mid * Maf.TAU / OBJECTS;
      const r2 = .5;
      const x2 = r2 * Math.cos(a2);
      const y2 = r2 * Math.sin(a2);
      m.rotation.y = -a2;
      const s = .6 + .4 * easings.InQuint(.5 + .5 * Math.sin(RUNS*t*Maf.TAU + id * Maf.TAU / RINGS + mid * Maf.PI ));
      m.scale.setScalar(s);
      m.position.set(x2,0,y2);
    })

    const a2 = TWISTS*id * Maf.TAU / RINGS + t * Maf.TAU;
    o.stick.rotation.y = -a2 + Maf.PI/2;

    const a3 = TWISTS*id * Maf.TAU / RINGS + t * Maf.TAU;
    const r2 = .4*Math.sin(RUNS*t*Maf.TAU + id * Maf.TAU / RINGS);
    const x2 = r2 * Math.cos(a3);
    const y2 = r2 * Math.sin(a3);
    o.center.rotation.y = -a3;
    o.center.rotation.z = Maf.PI/2;
    o.center.position.set(x2,0,y2);
    o.center.scale.x = o.center.scale.z = .25 + .8*.4*easings.InQuint(Math.abs(r2)/.4);
  });

  group.rotation.x = Maf.TAU / 8 + Math.cos(t*Maf.TAU) * Maf.TAU / 16;
  group.rotation.z = Math.sin(t*Maf.TAU) * Maf.TAU / 32;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
