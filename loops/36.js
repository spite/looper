import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {Curves} from '../third_party/THREE.CurveExtras.js';
import Maf from '../modules/maf.js';
import {TubeBufferGeometry} from '../modules/three-tube-geometry.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const curve = new THREE.Curves.DecoratedTorusKnot4a();

function addCurve( origin, radius, angle, length, cylinderRadius ) {

  var points = Math.floor( 50 * length / Math.PI );

  var p = new THREE.Vector3();
  var vertices = [];

  const step = .01;
  for(let a=angle; a<angle+length; a+=step) {

    const res = curve.getPoint(a/Maf.TAU);
    p.copy(res.multiplyScalar(.05).add(origin));
    p.y*=.85;
    vertices.push( p.clone() );

  }

  var path = new THREE.CatmullRomCurve3(vertices);
  var geometry = new TubeBufferGeometry( path, 2*vertices.length, (i) => Maf.parabola(i,1)*cylinderRadius, 18, !true );

  return geometry;

}

const values = [];
const curveMaterial = new THREE.MeshStandardMaterial({
  wireframe: !true,
  color: 0xb70000,
  metalness: .1,
  roughness: .1,
  side: THREE.DoubleSide
});

const whiteMaterial = curveMaterial.clone();
whiteMaterial.color.setHex(0xdedede);
const blackMaterial = curveMaterial.clone();
blackMaterial.color.setHex(0x404040);

const r = .5;
for(let j=0; j<20; j++) {
  const multiplier = Math.floor(Maf.randomInRange(1,1.1));
  const origin = new THREE.Vector3(Maf.randomInRange(-r,r),Maf.randomInRange(-r,r),Maf.randomInRange(-r,r));
  const radius = Maf.randomInRange(4.5,5);
  const start = Maf.randomInRange(0,.5*Maf.PI);
  const length = .5*Maf.randomInRange(Math.PI/4, Math.PI/2);
  const cylinderRadius = .2*length;
  const rotation = Maf.randomInRange(-.5,.5);
  const material = Math.random() > .25 ? (Math.random() > .5 ? blackMaterial : whiteMaterial) : curveMaterial;
  values.push({origin, radius, start, length, cylinderRadius, rotation, material, multiplier})
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

camera.position.set(0,0,17);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  while (group.children.length) {
    let m = group.children[0];
    group.remove(m);
    m.geometry.dispose();
    m = null;
  }

  values.forEach( v => {
    const offset = time * 2 * v.multiplier * Math.PI / loopDuration;
    const geo = addCurve( v.origin, v.radius, v.start + offset, v.length, v.cylinderRadius);
    const mesh = new THREE.Mesh(geo, v.material);
    mesh.rotation.y = v.rotation;
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
