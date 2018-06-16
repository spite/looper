import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import {Curves} from '../third_party/THREE.CurveExtras.js';
import RoundedCylinderGeometry from '../modules/three-rounded-cylinder.js';
import Maf from '../modules/maf.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const material = new THREE.MeshStandardMaterial({metalness: .1, roughness: .2});

const curve = new THREE.Curves.HeartCurve();

const geometry = new RoundedCylinderGeometry(.125,.1,.02,10);

const CYLS = 72*2;
const cylinders = [];
for (let j=0; j<CYLS; j++) {
  const mesh = new THREE.Mesh(geometry, material.clone());
  group.add(mesh);
  mesh.material.color = new THREE.Color().setHSL(.5,.5,.5);
  mesh.castShadow = mesh.receiveShadow = true;
  cylinders.push(mesh);
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

camera.position.set(-4,4,12);
const target = new THREE.Vector3(-.25,.25,0);
camera.lookAt(target);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;
const next = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const m = new THREE.Matrix4();

  cylinders.forEach( (sphere,id) => {
    const leaf = Math.floor(id/(CYLS/3));
    const subT = id % (CYLS/3);
    const t = subT / (CYLS/3) + 8 *( time / loopDuration ) / (CYLS/3);
    const a = leaf * 2 * Math.PI / 3;
    m.makeRotationZ(a);
    curve.getPoint( t, sphere.position);
    sphere.position.multiplyScalar(.025);
    sphere.position.y +=2;
    sphere.position.applyMatrix4(m);

    curve.getPoint( (t + .01/loopDuration)%1, next);
    next.multiplyScalar(.025);
    next.y += 2;
    next.applyMatrix4(m);
    sphere.lookAt(next);

    const s = Maf.parabola((2*t%1),2);
    sphere.scale.setScalar(.3+2*s);
    //sphere.scale.z = 1 + .5 / sphere.scale.z;
    sphere.material.color.setHSL(0.43472222222 + .025  - .05 * s,1,.31 - .05 * s);

  })

  group.rotation.z = -time * (2 * Math.PI / 3 ) / loopDuration;
  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
