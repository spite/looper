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

const material = new THREE.MeshStandardMaterial({color: 0xb70000, metalness: .4, roughness: 1});
const geometry = new RoundedExtrudedPolygonGeometry(.55,.2,6,1,.05,.05,5);

const SIZE = 12;
const blocks = []
for (let y=-SIZE;y<SIZE;y++) {
  for (let x=-SIZE;x<SIZE;x++) {
    const mesh = new THREE.Mesh(geometry,material.clone());
    mesh.position.x = .85*x;
    mesh.position.z = y + (x%2?.5:0);
    mesh.rotation.x = Math.PI / 2;
    const s = .05;
    const n = noise.perlin3(s*x, s*y, .1);
    mesh.material.color.setHSL(n,.6,.5);
    group.add(mesh);
    mesh.castShadow = mesh.receiveShadow = true;
    blocks.push({x,y,mesh});
  }
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

camera.position.set(0,14,14);
camera.lookAt(new THREE.Vector3(0,0,3));
camera.rotation.z -= .2;
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2.5;

function draw(startTime) {

  const time = (.001 * (performance.now()-startTime)) % loopDuration;

  const peak = 1-time/loopDuration;
  blocks.forEach( b => {
    const dx = b.x;
    const dy = b.y + ( -2*SIZE + 4 * SIZE * peak);
    //const d = easings.OutQuad(Maf.clamp(Math.sqrt(dx*dx+dy*dy),0,SIZE)/SIZE,0,.5);
    const d = easings.OutBack(Maf.clamp(.85*Math.sqrt(dx*dx+dy*dy),0,SIZE)/SIZE,2.);
    const depth = -4 / Math.exp(d*d*d*d);
    b.mesh.position.y = depth;
    const a = .5*Math.PI / Math.exp(d*d*d);
    b.mesh.rotation.x = a + .32*Math.PI;
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
