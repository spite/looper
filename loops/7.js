import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import {Curves} from '../third_party/THREE.CurveExtras.js';
import RoundedCylinderGeometry from '../modules/three-rounded-cylinder.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const material = new THREE.MeshStandardMaterial({metalness: 0, roughness: .1});

const curve = new THREE.Curves.GrannyKnot();

const SPHERES = 72;
const spheres = [];
for (let j=0; j<SPHERES; j++) {
  const r = .5 + Math.random();
  const geometry = new RoundedCylinderGeometry(.25*r,.25*r,.1,10);
  const mesh = new THREE.Mesh(geometry, material.clone());
  group.add(mesh);
  mesh.material.color = new THREE.Color().setHSL(.8 + .2 * (r-.5),.5,1 - (.25 + .5 * (r-.5)));
  mesh.castShadow = mesh.receiveShadow = true;
  spheres.push(mesh);
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
const next = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  spheres.forEach( (sphere,id) => {
    const t = ( time / loopDuration + id/SPHERES ) % 1;
    curve.getPoint( t, sphere.position);
    curve.getPoint( (t + .1/loopDuration)%1, next);
    sphere.position.multiplyScalar(.08);
    sphere.lookAt(next.multiplyScalar(.08));
  })

  group.rotation.y = time * 2 * Math.PI / loopDuration;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
