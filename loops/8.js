import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const material = new THREE.MeshStandardMaterial({color: 0x808080, metalness: 0, roughness: .1});
const geometry = new RoundedExtrudedPolygonGeometry(.5,20,6,1,.05,.05,5);

const d = 20;
const blocks = []
for (let y=-d;y<d;y++) {
  for (let x=-d;x<d;x++) {
    const mesh = new THREE.Mesh(geometry,material.clone());
    mesh.position.x = .85*x;
    mesh.position.z = y + (x%2?.5:0);
    mesh.rotation.x = Math.PI / 2;
    group.add(mesh);
    mesh.castShadow = mesh.receiveShadow = true;
    blocks.push(mesh);
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

camera.position.set(10,12,10);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  let ptr = 0;
  for (let y=-d;y<d;y++) {
    for (let x=-d;x<d;x++) {
      const px = blocks[ptr].position.x;
      const py = blocks[ptr].position.z;
      const offset = Math.sqrt(px*px+py*py);
      blocks[ptr].position.y = 2 * (.5+.5 * Math.cos(time*2*Math.PI/loopDuration+offset));
      const decay = .5 - .01 * offset;
      const h = .5 + .5 *Math.cos(.25*px) + .5 + .5 *Math.cos(.25*py);
      blocks[ptr].material.color.setHSL((h+time/loopDuration)%2,decay,decay);
      ptr++;
    }
  }

  group.rotation.y = time * 2 * Math.PI / loopDuration;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
