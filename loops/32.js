import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';
import noise from '../third_party/perlin.js';
import Maf from '../modules/maf.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const h = .25;
const material = new THREE.MeshStandardMaterial({color: 0xb70000, metalness: .5, roughness: 1});
const geometry = new RoundedExtrudedPolygonGeometry(.525,h,3,1,.05,.05,5);

const SIZE = 12;
const blocks = []
for (let y=-SIZE;y<SIZE;y++) {
  for (let x=-SIZE;x<SIZE;x++) {
    const mesh = new THREE.Mesh(geometry,material.clone());
    mesh.position.x = .85*x;
    mesh.position.y = .5*h;
    mesh.position.z = y + (x%2?.5:0);
    mesh.rotation.x = Math.PI / 2;
    const s = .05;
    const n = noise.perlin3(s*x, s*y, .1);
    mesh.material.color.setHSL(n,.7,.5);
    group.add(mesh);
    mesh.castShadow = mesh.receiveShadow = true;
    blocks.push({x,y,mesh});
  }
}
const blocks2 = []
for (let y=-SIZE;y<SIZE;y++) {
  for (let x=-SIZE;x<SIZE;x++) {
    const mesh = new THREE.Mesh(geometry,material.clone());
    mesh.position.x = .85*x + .25;
    mesh.position.y = -.5*h;
    mesh.position.z = y + (x%2?.5:0) + .5;
    mesh.rotation.x = Math.PI / 2;
    mesh.rotation.y = Math.PI;
    const s = .05;
    const n = noise.perlin3(s*x, s*y, .1);
    mesh.material.color.setHSL(n,.7,.5);
    group.add(mesh);
    mesh.castShadow = mesh.receiveShadow = true;
    blocks2.push({x,y,mesh});
  }
}
scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set(-1,1,1);
directionalLight.castShadow = true;
const s = 15;
directionalLight.shadow.camera.near = -10;
directionalLight.shadow.camera.left = -s;
directionalLight.shadow.camera.right = s;
directionalLight.shadow.camera.top = s;
directionalLight.shadow.camera.bottom = -s;
directionalLight.shadow.camera.updateProjectionMatrix();
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight2.position.set(1,2,1);
directionalLight2.castShadow = true;
directionalLight2.shadow.camera.near = -10;
directionalLight2.shadow.camera.left = -s;
directionalLight2.shadow.camera.right = s;
directionalLight2.shadow.camera.top = s;
directionalLight2.shadow.camera.bottom = -s;
directionalLight2.shadow.camera.updateProjectionMatrix();
scene.add( directionalLight2 );

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight( 0xcefeff, 0xb3eaf0, .5 );
scene.add( light );

camera.position.set(0,20,0);
camera.lookAt(new THREE.Vector3(0,0,0));
camera.rotation.z = -Math.PI/2 + Math.PI/4;
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  const peak = 1-time/loopDuration;
  blocks.forEach( b => {
    const dx = b.x;
    const dy = b.y + ( -2*SIZE + 4 * SIZE * peak);
    const d = easings.InOutQuint(Maf.clamp(.85*Math.sqrt(dx*dx+dy*dy),0,SIZE)/SIZE,2.);
    const depth = -4 + 4 / Math.exp(d*d*d*d);
    b.mesh.position.y = depth + .5*h;
    const d2 = easings.InOutQuint(peak);
    b.mesh.rotation.z = d2*2*Math.PI/3;
    const a = -.5*Math.PI / Math.exp(d*d*d);
  });
  blocks2.forEach( b => {
    const dx = b.x;
    const dy = b.y + ( -2*SIZE + 4 * SIZE * peak);
    const d = easings.OutBack(Maf.clamp(.85*Math.sqrt(2*dx*dx+dy*dy),0,SIZE)/SIZE,2.);
    const depth = -4 + 4 / Math.exp(d*d*d*d);
    b.mesh.position.y = depth - .5*h;
    b.mesh.rotation.z = easings.InOutQuint(time/loopDuration)*2*Math.PI/3;
    const d2 = easings.InOutQuint(peak);
    b.mesh.rotation.z = d2*2*Math.PI/3;
    const a = -.5*Math.PI / Math.exp(d*d*d);
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
