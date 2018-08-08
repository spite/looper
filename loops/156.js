import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';
import {palette2 as palette} from '../modules/floriandelooij.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';

palette.range = ["#CA0045", "#052269", "#FFC068", "#114643", "#9BC2B5", "#CE8D3D", "#BD3E30"]
const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const objects = [];

const RINGS = 60;
const OBJECTS = 10;
const geo = new RoundedExtrudedPolygonGeometry(2,2.5,6,1,.5,.25,5);
const m = new THREE.Matrix4().makeRotationX(Maf.PI /2);
geo.applyMatrix(m);
const mats = palette.range.map( (c) => new THREE.MeshStandardMaterial({color: c, metalness: .1, roughness: .5}));

for (let j=0; j<RINGS; j++) {
  const pivot = new THREE.Group();
  const meshes = [];
  const centers = [];

  const pivot2 = new THREE.Group();
  pivot.add(pivot2);

  for (let k=0; k<OBJECTS; k++) {
    const mesh = new THREE.Mesh(geo,mats[Math.floor(Math.random()*mats.length)]);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.scale.setScalar(Maf.randomInRange(.05,.2));
    const a = k * Maf.TAU / OBJECTS;
    const r = 1;
    mesh.position.x = r * Math.cos(a);
    mesh.position.z = r * Math.sin(a);
    mesh.position.y = Maf.randomInRange(-.5,.5);
    pivot2.add(mesh);
    meshes.push(mesh);
  }

  objects.push({meshes, pivot, pivot2});
  group.add(pivot);
}
group.scale.setScalar(.25);
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

camera.position.set(0,6,0);
camera.lookAt(new THREE.Vector3(0,0,0));
camera.rotation.z = 3*Math.PI/4;
renderer.setClearColor(palette.range[2],1);
scene.fog = new THREE.FogExp2( palette.range[2], 0.1 );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach( (o, id) => {
    const r = 4;
    const a = id * Maf.TAU / RINGS;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    const z = 0;

    o.pivot.position.set(x,y,z);
    o.pivot.rotation.z = a + Math.sin(t*Maf.TAU) * Maf.TAU / 8;

    o.pivot2.rotation.y = - t * Maf.TAU  + id * Maf.TAU / RINGS;

    o.meshes.forEach( (m, mid) => {
      const a = mid * Maf.TAU / OBJECTS;
      const r = 1 + ( .5 + .5 * Math.sin(t*Maf.TAU));
      m.position.x = r * Math.cos(a);
      m.position.z = r * Math.sin(a);
    })
  });
  group.rotation.z = t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
