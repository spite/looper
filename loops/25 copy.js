import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import getLemniscatePoint from '../modules/lemniscate.js';
import Maf from '../modules/maf.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

function addCurve( origin, radius, angle, length, cylinderRadius ) {

  var points = Math.floor( 50 * length / Math.PI );

  var p = new THREE.Vector3();
  var vertices = [];
  var colors = [];
  var c = new THREE.Color();
  c.setRGB(255,0,255);

  const step = .1;
  for(let a=angle; a<angle+length; a+=step) {

    const res = getLemniscatePoint(a);
    const z = Math.sin(a);
    p.set(radius * res.x, 1.25*radius * res.y, z);
    p.add(origin);

    vertices.push( p.clone() );
    colors.push( c.clone() );

  }

  var path = new THREE.CatmullRomCurve3(vertices);
  var geometry = new THREE.TubeGeometry( path, 2*vertices.length, cylinderRadius, 18, !true );
  for( var j = 0; j < geometry.vertices.length; j++ ) {
    geometry.colors.push( c.clone() )
  }

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
for(let j=0; j<40; j++) {
  const multiplier = Math.floor(Maf.randomInRange(1,5));
  const origin = new THREE.Vector3(Maf.randomInRange(-r,r),Maf.randomInRange(-r,r),Maf.randomInRange(-r,r));
  const radius = Maf.randomInRange(4.5,5);
  const start = Maf.randomInRange(0,2*Math.PI);
  const length = Maf.randomInRange(Math.PI/8, Math.PI/4);
  const cylinderRadius = .15*length;
  const rotation = Maf.randomInRange(-.5,.5);
  const material = Math.random() > .25 ? (Math.random() > .5 ? blackMaterial : whiteMaterial) : curveMaterial;
  values.push({origin, radius, start, length, cylinderRadius, rotation, material, multiplier})
}
for(let j=0; j<10; j++) {
  const multiplier = Math.floor(Maf.randomInRange(1,5));
  const origin = new THREE.Vector3(Maf.randomInRange(-r,r),Maf.randomInRange(-r,r),Maf.randomInRange(-r,r));
  const radius = Maf.randomInRange(4.5,5);
  const start = Maf.randomInRange(0,2*Math.PI);
  const length = Maf.randomInRange(Math.PI/4, Math.PI/2);
  const cylinderRadius = .05;
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

camera.position.set(0,-5,19);
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

  const d = 2 / canvas.width;
  cameraOffset.set(
    Maf.randomInRange(-d,d),
    Maf.randomInRange(-d,d),
    Maf.randomInRange(-d,d)
  );

  camera.position.set(0,-5,19);
  camera.position.add(cameraOffset);
  group.rotation.x = 2 * Math.PI * time / loopDuration;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
