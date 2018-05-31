import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import {curl} from '../modules/curl.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const geo = new THREE.IcosahedronBufferGeometry(.1,3);
const mat = new THREE.MeshStandardMaterial({metalness:0, roughness:.25});
const objects = [];
for (let y=0; y<20; y++) {
  for (let x=0; x<20; x++) {
    const mesh = new THREE.Mesh(
      geo,
      mat.clone()
    );
    mesh.scale.set(1,1,.5);
    mesh.position.set(.25*(x-9.5),.25*(y-9.5),0);
    mesh.receiveShadow = mesh.castShadow = true;
    group.add(mesh);

    const p = mesh.position.clone();
    p.x *= .1;
    p.y *= .05;
    const rotation = curl(p).clone();
    rotation.multiplyScalar(Maf.PI);
    const offset = y * 20 + x;
    mesh.material.color.setHSL(offset/400,.5,.5);
    objects.push({x,y,offset,mesh,rotation});
  }
}

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

camera.position.set(0,0,8);
camera.lookAt(group.position);
renderer.setClearColor(0x101010,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach( o => {
    const c = o.rotation;
    const offset = o.offset / 400;
    const f = Maf.parabola(easings.InOutQuad((t+offset)%1),1);
    o.mesh.scale.x = 1 + f;
    o.mesh.rotation.set(c.x*f,c.y*f,c.z*f);
  })

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
