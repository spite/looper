import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const material = new THREE.MeshStandardMaterial({color: 0x25a15d,metalness: 0, roughness: 1});
const geometry = new RoundedBoxGeometry(.5,1,1,.05,2);

const NUM = 16;
const cubes = []
for (let j=0; j<NUM; j++) {
  const base = new THREE.Group();
  const m = material.clone();
  m.color = new THREE.Color().setHSL(j/NUM,.5,.5);
  const cube = new THREE.Mesh(geometry, m);
  cube.castShadow = cube.receiveShadow = true;
  cubes.push({cube,base});
  base.add(cube)
  group.add(base);
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

const loopDuration = 3;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  const r = 2;
  cubes.forEach( (cube,id) => {
    const a = time * 2 * Math.PI / loopDuration;
    const aa = id * 2 * Math.PI / NUM;
    const x = r * Math.cos(a + id * Math.PI / NUM);
    const y = 0;
    const z = 0;
    const s = .5 + .5 * Math.sin(a + id * 2 * Math.PI / NUM);
    cube.cube.position.set(x,y,z);
    cube.cube.scale.setScalar(.5+ .5*s);
    cube.base.rotation.y = id * 2 * Math.PI / NUM;
    cube.base.rotation.z = a + id * Math.PI / NUM;
  })

  group.rotation.y = time * 2 * Math.PI / loopDuration;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
