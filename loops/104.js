import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
import Maf from '../modules/maf.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const objects = [];
const r = .35;
const geo = new RoundedBoxGeometry(r,r,r,.05,5);

const CUBES = 60;
const LOOPS = 40;
for (let j=0; j<CUBES; j++) {
  const material = new THREE.MeshStandardMaterial({color: 0xdedede, metalness: .1, roughness: .5});
  material.color.setHSL(j/CUBES,.75,.5);

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = mesh.receiveShadow = true;
  const ma = j * Maf.TAU / CUBES;
  const mr = 2;
  const mx = mr * Math.cos(ma);
  const my = mr * Math.sin(ma);
  const mz = 0;
  const pivot = new THREE.Group();
  pivot.position.set(mx,my,mz);
  pivot.rotation.z = ma;
  const pivot2 = new THREE.Group();
  pivot.add(pivot2);
  const ta = ( j % LOOPS ) * Maf.TAU / LOOPS;
  const tr = 1;
  const px = tr * Math.cos(ta);
  const py = 0;
  const pz = tr * Math.sin(ta);
  mesh.position.set(px,py,pz);
  mesh.rotation.y = ta;
  pivot2.add(mesh);
  const px2 = tr * Math.cos(ta + Maf.PI);
  const py2 = 0;
  const pz2 = tr * Math.sin(ta + Maf.PI);
  const mesh2 = mesh.clone();
  mesh2.position.set(px2,py2,pz2);
  mesh2.rotation.y = ta + Maf.PI;
  pivot2.add(mesh2);
  group.add(pivot);
  objects.push({pivot,pivot2,mesh,ta});
}
group.scale.setScalar(.5);
scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-2,2,2);
directionalLight.castShadow = true;
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight2.position.set(4,8,4);
directionalLight2.castShadow = true;
scene.add( directionalLight2 );

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight( 0xcefeff, 0xb3eaf0, .5 );
scene.add( light );

camera.position.set(0,0,6);
camera.lookAt(0,0,0);
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time/loopDuration;

  objects.forEach( (o,i) => {
    o.pivot2.rotation.y = -t * Maf.TAU;
  });
  //group.rotation.z = t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
