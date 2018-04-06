import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-20,20,20);
directionalLight.target.position.set(-6,0,6);
const ss = 14;
directionalLight.shadow.camera.left = -ss;
directionalLight.shadow.camera.right = ss;
directionalLight.shadow.camera.top = ss;
directionalLight.shadow.camera.bottom = -ss;
scene.add(directionalLight.target);
directionalLight.castShadow = true;
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight2.position.set(10,20,10);
directionalLight2.castShadow = true;
directionalLight2.target.position.set(0,-10,0);
scene.add(directionalLight2.target);
directionalLight2.shadow.camera.left = -ss;
directionalLight2.shadow.camera.right = ss;
directionalLight2.shadow.camera.top = ss;
directionalLight2.shadow.camera.bottom = -ss;
scene.add( directionalLight2 );

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight( 0xcefeff, 0xb3eaf0, .5 );
scene.add( light );

camera.position.set(4.5,4.5,4.5);
camera.lookAt(group.position);
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const material = new THREE.MeshStandardMaterial({color: 0x808080, metalness: 0, roughness: .1});
const geometry = new THREE.BoxBufferGeometry(1,1,1,.05,2);

const SIZE = 5;
const cubes = [];

function addCube(x,y,z) {
  const mesh = new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  mesh.castShadow = mesh.receiveShadow = true;
  const offset = (z+1)*9+(y+1)*3+(x+1);
  cubes.push({mesh,x,y,z,offset});
  group.add(mesh);
}

for(let z=-1;z<2;z++) {
  for(let y=-1;y<2;y++) {
    for(let x=-1;x<2;x++) {
      addCube(x,y,z);
    }
  }
}

scene.add(group);

const loopDuration = 2;
const s = 4;
const DEPTH = 5;
const tmpVector = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  const steps = 27;
  cubes.forEach( c => {
    let f;
    const o = c.offset/steps;
    c.mesh.visible = true;
    if (t<o) {
      f = 0;
      c.mesh.visible = false;
    }
    else {
      f = (t-o)/(1/steps);
    }
    if( c.offset===0) f =1;
    f = Maf.clamp(0,1,f);
    c.mesh.scale.setScalar(f);
  });

  const s = Maf.mix(1,1/3,easings.Linear(t));
  group.scale.setScalar(s);
  group.position.x = Maf.mix(0,-1,t);
  group.position.y = Maf.mix(0,-1,t);
  group.position.z = Maf.mix(0,-1,t);

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
