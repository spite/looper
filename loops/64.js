import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
import easings from '../modules/easings.js';
import RoundedCylinderGeometry from '../modules/three-rounded-cylinder.js';
import pointOnSphere from '../modules/points-sphere.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-20,20,20);
directionalLight.target.position.set(-6,0,6);
const ss = 14;
directionalLight.shadow.camera.left = -ss;
directionalLight.shadow.camera.right = ss;
directionalLight.shadow.camera.top = ss;
directionalLight.shadow.camera.bottom = -ss;
scene.add(directionalLight.target);
directionalLight.castShadow = true;
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight2.position.set(10,20,10);
directionalLight2.castShadow = true;
directionalLight2.target.position.set(0,-10,0);
scene.add(directionalLight2.target);
directionalLight2.shadow.camera.left = -ss;
directionalLight2.shadow.camera.right = ss;
directionalLight2.shadow.camera.top = ss;
directionalLight2.shadow.camera.bottom = -ss;
scene.add( directionalLight2 );

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight( 0xcefeff, 0xb3eaf0, .5 );
scene.add( light );

camera.position.set(0,20,0);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const colors = [
  new THREE.Color().setHex(0xfd6c22),
  new THREE.Color().setHex(0xfcd748),
  new THREE.Color().setHex(0x32e8b7),
  new THREE.Color().setHex(0x5571fa),
];

const material = new THREE.MeshStandardMaterial({color: 0x808080, metalness: .1, roughness: .5});
const geometries = [
  new RoundedBoxGeometry(1,1,1,.05,2),
  new THREE.IcosahedronBufferGeometry(.5,3),
  new RoundedCylinderGeometry(.5,1,.05,2).applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-.5))
];

function addGroup(num) {
  const objects = [];
  for (let i=0; i<num; i++) {
    const mesh = new THREE.Mesh(geometries[Math.floor(Math.random()*geometries.length)],material.clone());
    mesh.material.color = colors[Math.floor(Math.random()*colors.length)];
    mesh.position.set(Maf.randomInRange(-15,15),Maf.randomInRange(-15,15),Maf.randomInRange(-1,1));
    mesh.scale.setScalar(.9);
    mesh.castShadow = mesh.receiveShadow = true;
    objects.push({
      mesh,
      x:mesh.position.x,
      y:mesh.position.y,
      z:mesh.position.z,
      scale:.5+1.5*Math.random(),
      offset:Math.random(),
      speed: 1+Math.random(),
    });
    group.add(mesh);
  }
  return objects;
}

const objects = addGroup(400);

scene.add(group);
scene.scale.set(.5,.5,.5);

const loopDuration = 2;
const s = 4;
const tmpVector = new THREE.Vector3();
let prevTime = -1;
const prev = new THREE.Vector3();
const spherePoints = pointOnSphere(64);
let frame = 0;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  const f = .25;
  if(time<prevTime) prevTime -= loopDuration;
  const ts = (time-prevTime)/(loopDuration/60);

  const t = time / loopDuration;
  const s = Maf.parabola(t,1);

  objects.forEach( c => {
    c.mesh.position.x = c.x;
    c.mesh.position.y = c.y;
    c.mesh.position.z = -15 + ((t+c.offset)%1) * c.speed * 30 + c.z;
    c.mesh.scale.setScalar(c.scale);
    c.mesh.rotation.x = c.offset + t * Maf.TAU * c.speed;
  });

  //group.rotation.z = time * Maf.TAU / loopDuration;

  /*const jitter = 0.01;
  directionalLight.position.set(
    1+Maf.randomInRange(-jitter,jitter),
    1+Maf.randomInRange(-jitter,jitter),
    1+Maf.randomInRange(-jitter,jitter),
  );
  directionalLight2.position.set(
    1+Maf.randomInRange(-jitter,jitter),
    2+Maf.randomInRange(-jitter,jitter),
    1+Maf.randomInRange(-jitter,jitter),
  );

  frame++;
  frame %= 64;
  scene.position.copy(spherePoints[frame]).multiplyScalar(jitter);*/

  renderer.render(scene, camera);
  prevTime = time;
}

export { draw, loopDuration, canvas };
