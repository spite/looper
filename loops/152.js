import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';
import {palette2 as palette} from '../modules/floriandelooij.js';
import getLemniscatePoint from '../modules/lemniscate.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';

palette.range = ["#BC0A05", "#FFFFFF", "#DF5D4A", "#EB9373", "#F4BA9F",];//["#A36091", "#7B659B", "#F5577E", "#E8D3E2", "#513B49"];//["#CADE8B", "#F6F8F6", "#294E30", "#1A1C1E", "#63954B"];
const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const objects = [];

const RINGS = 60;
const OBJECTS = 10;
const geo = new RoundedExtrudedPolygonGeometry(1,1,5,1,.1,.25,5);
const m = new THREE.Matrix4().makeRotationX(Maf.PI /2);
geo.applyMatrix(m);
const mats = [
  new THREE.MeshStandardMaterial({color: palette.range[0], metalness: .1, roughness: .25}),
  new THREE.MeshStandardMaterial({color: palette.range[1], metalness: .1, roughness: .25}),
  new THREE.MeshStandardMaterial({color: palette.range[2], metalness: .1, roughness: .25}),
  new THREE.MeshStandardMaterial({color: palette.range[3], metalness: .1, roughness: .25}),
  new THREE.MeshStandardMaterial({color: palette.range[4], metalness: .1, roughness: .25}),
];
mats.forEach(m=>{
  const hsl = m.color.getHSL();
  m.color.setHSL(hsl.h,hsl.s+.1,hsl.l-.05);
});

for (let j=0; j<RINGS; j++) {
  const pivot = new THREE.Group();
  const meshes = [];
  const centers = [];

  for (let k=0; k<OBJECTS; k++) {
    const mesh = new THREE.Mesh(geo,mats[Math.floor(Math.random()*mats.length)]);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.scale.x = Maf.randomInRange(.5,5);
    mesh.userData.scale = mesh.scale.x;
    pivot.add(mesh);
    meshes.push(mesh);
  }

  objects.push({meshes, pivot});
  group.add(pivot);
}
group.scale.setScalar(.75);
scene.add(group);
group.rotation.x = -Maf.PI/2;

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

camera.position.set(0,6,6);
camera.lookAt(new THREE.Vector3(0,0,0));
camera.rotation.z = 3*Math.PI/4;
renderer.setClearColor(0x130501,1);
scene.fog = new THREE.FogExp2( palette.base[0], 0.05 );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach( (o, id) => {
    const s = easings.InOutQuad(.5 + .5 * Math.sin(1*id*Maf.TAU/RINGS+2*t*Maf.TAU));
    const a = id * Maf.TAU / RINGS;
    const r = 3;
    const {x, y} = getLemniscatePoint(a);
    const next = getLemniscatePoint(a+Maf.TAU/RINGS);
    const z = 0;

    o.pivot.position.set(r*x,r*y,z);
    o.pivot.rotation.z = Math.atan2(next.y-y, next.x-x) + Math.PI/2;

    o.meshes.forEach( (m, mid) => {
      const a2 = id * Maf.TAU / RINGS + t * Maf.TAU + mid * Maf.TAU / OBJECTS;
      const r2 = .5 * s;
      const x2 = r2 * Math.cos(a2);
      const y2 = r2 * Math.sin(a2);
      m.rotation.y = -a2;
      m.position.set(x2,0,y2);
      const d = Math.sqrt(x2*x2+y2*y2);
      const ss = .05*m.userData.scale * s;
      m.scale.setScalar(ss);
    });

  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
