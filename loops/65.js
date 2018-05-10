import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {Curves} from '../third_party/THREE.CurveExtras.js';
import Maf from '../modules/maf.js';
import {TubeBufferGeometry} from '../modules/three-tube-geometry.js';
import easings from '../modules/easings.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const groupI = new THREE.Group();
const groupO = new THREE.Group();
const groupSlash = new THREE.Group();

function OCurve( scale ) {

  THREE.Curve.call( this );

  this.scale = ( scale === undefined ) ? 5 : scale;

}

OCurve.prototype = Object.create( THREE.Curve.prototype );
OCurve.prototype.constructor = OCurve;

OCurve.prototype.getPoint = function ( t, optionalTarget ) {

  var point = optionalTarget || new THREE.Vector3();

  t *= 2 * Math.PI;

  var x = .5 * Math.sin( t );
  var y = .5 * Math.cos( t ) ;
  var z = 0;

  return point.set( x, y, z ).multiplyScalar( this.scale );

};

function ICurve( scale ) {

  THREE.Curve.call( this );

  this.scale = ( scale === undefined ) ? 5 : scale;

}

ICurve.prototype = Object.create( THREE.Curve.prototype );
ICurve.prototype.constructor = ICurve;

ICurve.prototype.getPoint = function ( t, optionalTarget ) {

  var point = optionalTarget || new THREE.Vector3();

  t *= 2 * Math.PI;

  var x = Maf.clamp(Math.sin(t), -.5, .5);
  var y = Maf.clamp(Math.cos(t), -.5, .5);
  var z = 0;

  return point.set( x, y, z ).multiplyScalar( this.scale );

};

const icurve = new ICurve(80);
const ocurve = new OCurve(80);

function addCurve( curve, orbitAngle, orbitRadius, angle, length, cylinderRadius, scale, rotation ) {

  var points = Math.floor( 50 * length / Math.PI );

  var p = new THREE.Vector3();
  var vertices = [];

  const step = .01;
  const prev = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let angleInc = 0;

  for(let a=angle; a<angle+length; a+=step) {

    const res = curve.getPoint(a/Maf.TAU);
    tmp.copy(res);
    const n = res.clone().sub(prev).normalize();

    const vector = new THREE.Vector3( 0,1.1*orbitRadius, 0 );
    vector.applyAxisAngle( n, orbitAngle+angleInc );
    res.add(vector);

    p.copy(res).multiplyScalar(.05);
    const f = p.clone();
    f.x *= scale.x;
    f.y *= scale.y;
    const d = Math.sqrt(f.x*f.x+f.y*f.y);
    const aa = Math.atan2(f.y,f.x);
    f.x = d * Math.cos(aa+rotation);
    f.y = d * Math.sin(aa+rotation);
    vertices.push( f );
    angleInc += .02;
  }

  var path = new THREE.CatmullRomCurve3(vertices);
  var geometry = new TubeBufferGeometry( path, vertices.length, (i) => Maf.parabola(i,.1)*cylinderRadius*i, 18, !true );

  return geometry;

}

const valuesI = [];
const valuesO = [];
const valuesSlash = [];

const curveMaterial = new THREE.MeshStandardMaterial({
  wireframe: !true,
  color: 0xb70000,
  metalness: .1,
  roughness: .1,
  side: THREE.DoubleSide
});

const colors = [
  new THREE.Color().setHex(0xfd6c22),
  new THREE.Color().setHex(0xfcd748),
  new THREE.Color().setHex(0x32e8b7),
  new THREE.Color().setHex(0x5571fa),
];

const count = 20;
const r = .5;
for(let j=0; j<count; j++) {
  const multiplier = Maf.randomInRange(0,.1);
  const origin = new THREE.Vector3(Maf.randomInRange(-r,r),Maf.randomInRange(-r,r),Maf.randomInRange(-r,r));
  const start = Maf.randomInRange(0,.2*Maf.PI);
  const length = 4*Maf.randomInRange(Math.PI/8, Math.PI/4);
  const cylinderRadius = .05*length;
  const material = curveMaterial.clone();
  material.color = (colors[Math.floor(Math.random()*colors.length)]);
  const orbitRadius = Maf.randomInRange(10,20);
  const orbitAngle = Maf.randomInRange(0,Maf.TAU);
  valuesI.push({orbitRadius, orbitAngle, origin, start, length, cylinderRadius, material, multiplier})
}
for(let j=0; j<count; j++) {
  const multiplier = Maf.randomInRange(0,.1);
  const origin = new THREE.Vector3(Maf.randomInRange(-r,r),Maf.randomInRange(-r,r),Maf.randomInRange(-r,r));
  const start = Maf.randomInRange(0,.2*Maf.PI);
  const length = 4*Maf.randomInRange(Math.PI/8, Math.PI/4);
  const cylinderRadius = .05*length;
  const material = curveMaterial.clone();
  material.color = (colors[Math.floor(Math.random()*colors.length)]);
  const orbitRadius = Maf.randomInRange(10,20);
  const orbitAngle = Maf.randomInRange(0,Maf.TAU);
  valuesO.push({orbitRadius, orbitAngle, origin, start, length, cylinderRadius, material, multiplier})
}
for(let j=0; j<count; j++) {
  const multiplier = Maf.randomInRange(0,.1);
  const origin = new THREE.Vector3(Maf.randomInRange(-r,r),Maf.randomInRange(-r,r),Maf.randomInRange(-r,r));
  const start = Maf.randomInRange(0,.2*Maf.PI);
  const length = 4*Maf.randomInRange(Math.PI/8, Math.PI/4);
  const cylinderRadius = .05*length;
  const material = curveMaterial.clone();
  material.color = (colors[Math.floor(Math.random()*colors.length)]);
  const orbitRadius = Maf.randomInRange(10,20);
  const orbitAngle = Maf.randomInRange(0,Maf.TAU);
  valuesSlash.push({orbitRadius, orbitAngle, origin, start, length, cylinderRadius, material, multiplier})
}

scene.add(groupI);
groupI.position.x = -3.5;
scene.add(groupO);
groupO.position.x = 2.5;
scene.add(groupSlash);
groupSlash.position.x = -1.5;

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

camera.position.set(0,0,18);
camera.lookAt(scene.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 1;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  while (groupI.children.length) {
    let m = groupI.children[0];
    groupI.remove(m);
    m.geometry.dispose();
    m = null;
  }

  while (groupO.children.length) {
    let m = groupO.children[0];
    groupO.remove(m);
    m.geometry.dispose();
    m = null;
  }

  while (groupSlash.children.length) {
    let m = groupSlash.children[0];
    groupSlash.remove(m);
    m.geometry.dispose();
    m = null;
  }

  valuesI.forEach( v => {
    const offset = (t + v.multiplier) * Maf.TAU;
    const geo = addCurve( icurve, v.orbitAngle, v.orbitRadius, v.start + offset, v.length, v.cylinderRadius, new THREE.Vector2(.25,1),0);
    const mesh = new THREE.Mesh(geo, v.material);
    mesh.castShadow = mesh.receiveShadow = true;
    groupI.add(mesh);
  });
  valuesO.forEach( v => {
    const offset = (t + v.multiplier) * Maf.TAU;
    const geo = addCurve( ocurve, v.orbitAngle, v.orbitRadius, v.start + offset, v.length, v.cylinderRadius, new THREE.Vector2(1,1),0);
    const mesh = new THREE.Mesh(geo, v.material);
    mesh.castShadow = mesh.receiveShadow = true;
    groupO.add(mesh);
  });
  valuesSlash.forEach( v => {
    const offset = (t + v.multiplier) * Maf.TAU;
    const geo = addCurve( icurve, v.orbitAngle, v.orbitRadius, v.start + offset, v.length, v.cylinderRadius, new THREE.Vector2(.25,1.5),-Math.PI/8);
    const mesh = new THREE.Mesh(geo, v.material);
    mesh.castShadow = mesh.receiveShadow = true;
    groupSlash.add(mesh);
  });

  //scene.rotation.y = time*Maf.TAU/loopDuration;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
