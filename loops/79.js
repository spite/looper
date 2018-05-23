import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const objects = [];
for (let i=0; i<4; i++) {
  objects[i] = [];
  for (let j=0; j<10; j++) {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(.5,4),
      new THREE.MeshStandardMaterial({color: 0x5186a6, metalness: .1, roughness: .5})
    );
    mesh.material.color.setHSL(j/10,.5,.5);
    mesh.receiveShadow = mesh.castShadow = true;
    group.add(mesh);
    objects[i].push(mesh);
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

camera.position.set(0,0,10);
camera.lookAt(group.position);
renderer.setClearColor(0x101010,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;
  const t2 = easings.InOutQuad(t);

  objects.forEach( (obj,i) => {
    obj.forEach( (o,j) => {
      const tt = ( t + i / objects.length ) % 1;
      const f = j / obj.length;
      const a = f*Maf.TAU - tt;
      const r = ((tt/obj.length)%(1/obj.length)-tt) * 3;
      const x = r * Math.cos(a);
      const y = r * Math.sin(a);
      const z = 0;
      const scale = Maf.parabola(tt,4);
      o.position.set(x,y,z);
      o.scale.setScalar(scale);
    });
  });

  group.rotation.z = t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
