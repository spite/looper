import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import {curl} from '../modules/curl.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
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

camera.position.set(0,20,0);
camera.lookAt(group.position);
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const material = new THREE.MeshStandardMaterial({color: 0x808080, metalness: 0, roughness: .1});
const geometry = new RoundedBoxGeometry(1.2,1.2,1.2,.05,2);

const SIZE = 5;
const cubes = [];
const cubes2 = [];
for (let y=-SIZE; y<SIZE; y++) {
  for (let x=-SIZE; x<SIZE; x++) {
    const mesh = new THREE.Mesh(geometry,material.clone());
    mesh.material = material.clone();
    mesh.material.color.setHSL(.1*x/SIZE+.1*y/SIZE,.5,.5);
    mesh.position.set(0,x+.5,y+.5);
    mesh.castShadow = mesh.receiveShadow = true;
    cubes.push({mesh,x,y,offset:Math.random()});
    const mesh2 = mesh.clone();
    cubes2.push({mesh:mesh2,x,y,offset:Math.random()});
    group.add(mesh);
    group.add(mesh2);
  }
}

scene.add(group);

const loopDuration = 2;
const s = 4;
const DEPTH = 5;
const tmpVector = new THREE.Vector3();
let prevTime = -1;
const prev = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  if(time<prevTime) {
    cubes.forEach( c => {
      c.mesh.position.set(0,c.y+.5,c.x+.5);
    });
  }

  const f = easings.InOutQuint(time/loopDuration);
  const ts = (time-prevTime)/(10/60);
  const ff = easings.InQuad(easings.InQuint(time/loopDuration));

  cubes.forEach( c => {
    const t = (( time + c.offset * loopDuration ) % loopDuration ) / loopDuration;
    tmpVector.copy(c.mesh.position);
    prev.copy(c.mesh.position);
    const res = curl(tmpVector.multiplyScalar(.1));
    c.mesh.position.add(res.multiplyScalar(ts*f*2.));
    c.mesh.scale.setScalar(1-easings.InQuint(time/loopDuration));
  });

  cubes2.forEach( c => {
    c.mesh.scale.setScalar(ff);
    c.mesh.position.set(-20+20*time/loopDuration,c.y+.5,c.x+.5);
  });

  group.rotation.z = Math.PI / 2 + 2*Math.PI * easings.Linear(time/loopDuration);

  renderer.render(scene, camera);
  prevTime = time;
}

export { draw, loopDuration, canvas };
