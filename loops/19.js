import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import getLemniscatePoint from '../modules/lemniscate.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const circle = new THREE.Group();

const material = new THREE.MeshStandardMaterial({color: 0xdedede, metalness: .1, roughness: .1});
const material2 = new THREE.MeshStandardMaterial({color: 0x202020, metalness: .1, roughness: .1});
const geo = RoundedFlatTorus(2,5,10);

const m = new THREE.Matrix4();
m.makeRotationX(0 * Math.PI);
geo.applyMatrix(m);

const pivot = new THREE.Group();

const objects = [];
const POINTS = 50;
for (let p=0; p<POINTS; p++) {
  const mesh = new THREE.Mesh(geo, p%2?material:material2);
  mesh.castShadow = mesh.receiveShadow = true;
  objects.push(mesh);
  mesh.scale.setScalar(.25);
  pivot.add(mesh);
}
group.add(pivot);
group.rotation.x = Math.PI / 4;
scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-1,1,1);
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

camera.position.set(0,-5,19);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;
const target = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  objects.forEach( (m, i) => {
    const a = i * 2 * Math.PI / POINTS + time * Math.PI / (loopDuration);
    const {x,y} = getLemniscatePoint(a);
    const z = Math.sin(a);
    const r = 4;
    m.position.set(x*r,y*r,z);
    const na = a;
    const res = getLemniscatePoint(na);
    const nz = Math.sin(na);
    target.set(res.x,res.y,nz);
    m.lookAt(target);
    m.scale.setScalar(.1 + .5*Math.abs(x));
  })

  group.rotation.y = time * Math.PI / loopDuration;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
