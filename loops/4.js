import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const material = new THREE.MeshStandardMaterial({color: 0xb70000,metalness: 0, roughness: 1});
const geometry = new THREE.BoxBufferGeometry(1,1,1);
const cube = new THREE.Mesh(geometry, material);
cube.castShadow = cube.receiveShadow = true;
group.add(cube);
const cube2 = new THREE.Mesh(geometry, material);
cube2.castShadow = cube2.receiveShadow = true;
group.add(cube2);
const cube3 = new THREE.Mesh(geometry, material);
cube3.castShadow = cube3.receiveShadow = true;
group.add(cube3);
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

camera.position.set(4,4,4);
camera.lookAt(cube.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 1;

function InOutQuint(t) {
  if ((t *= 2) < 1) return 0.5 * t * t * t * t * t;
  return 0.5 * ((t -= 2) * t * t * t * t + 2);
}

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime) ) % loopDuration;
  const t = time * 2 * Math.PI / loopDuration;
  const f = .75 + .25 * InOutQuint( .5 + .5 * Math.sin( t ));
  const f2 = 1 + 2 * InOutQuint( .5 + .5 * Math.cos( t ));

  cube.scale.set(f,f2,f);
  cube2.scale.set(f2,f,f);
  cube3.scale.set(f,f,f2);

  group.rotation.y = Math.PI / 2 * InOutQuint( time / loopDuration );

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
