import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const material = new THREE.MeshStandardMaterial({color: 0x25a15d,metalness: 0, roughness: 1});
const geometry = new THREE.BoxBufferGeometry(1,1,1);
const cubes = [];
let id = 0;
for (let z=0; z<3; z++) {
  for (let y=0; y<3; y++) {
    for (let x=0; x<3; x++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
      mesh.position.set(x-1,y-1,z-1);
      cubes.push({id,mesh,x,y,z});
      id++;
    }
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

camera.position.set(6,6,6);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 1;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  let f = 0;
  let f2 = 1;
  let ry = 0;
  if (time < .5 * loopDuration ) {
    f = 1 - easings.OutQuad( time / (.5 * loopDuration ));
  } else {
    f2 = 1 + 2 * easings.OutQuad(( time - .5 * loopDuration ) / (.5 * loopDuration));
    ry = Math.PI / 2 * easings.InOutQuint(( time - .5 * loopDuration ) / (.5 * loopDuration));
  }

  cubes.forEach( cube => {
    const s = (cube.id===13)?f2:f;
    cube.mesh.scale.setScalar(Math.max(s,.00001));
  });

  group.rotation.y = ry;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
