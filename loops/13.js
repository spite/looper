import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const material = new THREE.MeshStandardMaterial({color: 0xb71010, metalness: .4, roughness: .3});
const side = .25;

const CIRCLES = 10;
const COUNT = 20;

const circles = [];

for (let j=0; j<CIRCLES; j++) {
  const a = j * 2 * Math.PI / CIRCLES;
  const cr = 2;
  const cx = cr * Math.cos(a);
  const cy = cr * Math.sin(a);
  const circle = new THREE.Group();
  circle.position.set(cx,cy,0);
  if (j%2) {
    circle.rotation.x = Math.PI / 2;
    circle.rotation.y = a + Math.PI / 2 ;
  }
  const pivot = new THREE.Group();
  circle.add(pivot);
  const m = material.clone();
  m.color.setHSL(j/CIRCLES,.7,.5);
  for (let i=0; i<COUNT; i++) {
    const b = a + i * 2 * Math.PI / COUNT;
    const r = 1;
    const x = r * Math.cos(b);
    const y = r * Math.sin(b);
    const s = 1.25 + .5 * Math.cos(2*b);
    const geometry = new RoundedBoxGeometry(s*side,s*1.5*side,s*2*side,.05,2);
    const mesh = new THREE.Mesh(geometry,m);
    mesh.position.set(x, y, 0);
    mesh.rotation.z = b;
    mesh.castShadow = mesh.receiveShadow = true;
    pivot.add(mesh);
  }
  group.add(circle);
  circles.push(pivot);
}
scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set(-1,1,1);
directionalLight.castShadow = true;
const size = 20;
directionalLight.shadow.camera.left = -size;
directionalLight.shadow.camera.top = size;
directionalLight.shadow.camera.right = size;
directionalLight.shadow.camera.bottom = -size;
directionalLight.shadow.camera.updateProjectionMatrix();
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight2.position.set(1,2,1);
directionalLight2.castShadow = true;
const size2 = 20;
directionalLight2.shadow.camera.left = -size2;
directionalLight2.shadow.camera.top = size2;
directionalLight2.shadow.camera.right = size2;
directionalLight2.shadow.camera.bottom = -size2;
directionalLight2.shadow.camera.updateProjectionMatrix();
scene.add( directionalLight2 );

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight( 0xcefeff, 0xb3eaf0, .5 );
scene.add( light );

camera.position.set(-5,5,10);
camera.lookAt(new THREE.Vector3(0,0,0));
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2.5;

function draw(startTime) {

  const time = (.001 * (performance.now()-startTime)) % loopDuration;

  for (let i=0; i<circles.length; i++) {
    const sign = i % 2 ? -1 : 1;
    const freq = i % 2 ? 1 : -1;
    const offset = i % 2 ? 0 : .5 * i * Math.PI / 2;
    circles[i].rotation.z = offset + sign * time * freq * Math.PI / ( loopDuration);
  }
  group.rotation.z = -time * 2 * Math.PI / loopDuration,

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
