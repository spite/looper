import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const SIDES = 6;
const material = new THREE.MeshStandardMaterial({color: 0x808080, metalness: 0, roughness: .5});
const geometry = new RoundedExtrudedPolygonGeometry(.5,.5,SIDES,1,.05,.05,5);

const SIZE = 10;
const cubes = [];
for (let y=0; y<SIZE; y++) {
  for (let x=0; x<SIZE; x++) {
    const mesh = new THREE.Mesh(geometry,material.clone());
    mesh.position.set(x-.5*SIZE+.5,y-.5*SIZE+.5,0);
    mesh.position.z += 1;
    cubes.push({mesh,x,y});
    group.add(mesh);
    mesh.castShadow = mesh.receiveShadow = true;
  }
}

scene.add(group);
group.rotation.z = Math.PI / 2;

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

camera.position.set(0,0,20);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2.6;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  cubes.forEach( c => {
    const offset1 = .5 * Math.PI * c.mesh.position.y / SIZE + .1 * c.mesh.position.x;
    const offset2 = .5 * Math.PI * c.mesh.position.x / SIZE + .1 * c.mesh.position.y;
    c.mesh.rotation.z = Math.PI / SIDES + ( 2 * Math.PI * time / SIDES ) * easings.InOutQuint(time/loopDuration);
    c.mesh.rotation.y = 2 * Math.PI * time / loopDuration + offset2;
    const scale = .5 + .5 * easings.InOutQuad(.5 + .5 * Math.cos(2*c.mesh.rotation.y));
    c.mesh.position.z = -2 + 4 * scale;
    c.mesh.scale.setScalar(scale);
    const hue = .5 + .25 * Math.cos(c.mesh.rotation.y);
    const hue2 = .5 + .25 * Math.sin(c.mesh.rotation.x);
    c.mesh.material.color.setHSL(.5+(hue+hue2)/2,.55,.5);
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
