import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const SIDES = 8;
const whiteMaterial = new THREE.MeshStandardMaterial({color:0xffffff, metalness: .3, roughness: .2});
const blackMaterial = new THREE.MeshStandardMaterial({color:0xb70000, metalness: .3, roughness: .2});
const geo = new RoundedExtrudedPolygonGeometry(.375,.5,SIDES,1,.1,.25,5);

const S = 8;
const objects = [];
const mats = [];
for (let x=0; x<2*S+1; x++) {
  const mat = blackMaterial.clone();
  mat.color.setHSL(.5 + .05*x*Maf.TAU/S,.5,.5);
  mats.push(mat);
}
for (let y=-S; y<S+1; y++) {
  for (let x=-S; x<S+1; x++) {
    let mat = mats[x+S];
    const mesh = new THREE.Mesh(
      geo,
      mat
    );
    const pivot = new THREE.Group();
    mesh.position.z = -.375/2;
    mesh.scale.setScalar(.85);
    pivot.position.x = x + .5;
    pivot.position.y = y + .5;
    mesh.receiveShadow = mesh.castShadow = true;
    mesh.rotation.z = Maf.TAU / (2*SIDES);
    pivot.add(mesh);
    objects.push({pivot,x,y,mat});
    group.add(pivot);
  }
}
group.scale.setScalar(.1);
group.position.x -= .05;
group.position.y -= .05;
group.rotation.x =- Math.PI / 2;
scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-2,2,2);
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

camera.position.set(0,3.5,0);
camera.lookAt(new THREE.Vector3(0,0,0));
camera.rotation.z = Math.PI;
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;
const cameraOffset = new THREE.Vector3();

function myXOR(a,b) {
  return ( a || b ) && !( a && b );
}

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach( (o, id) => {
    const dx = .2 * o.x;
    const dy = .2 * o.y;

    const x = 3 * Math.abs(o.x);
    const y = 3 * Math.abs(o.y);
    const sign = Math.sign(Math.sin( Math.max(x,y)));

    const delay = 2 * ( Math.abs(dx) +  Math.abs(dy) );

    o.pivot.position.z = 4 * sign * Math.sin(t * Maf.TAU + delay);
    o.pivot.rotation.x = sign*easings.InOutQuad(Maf.mod(2*t+delay,1)) * Maf.PI;
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
