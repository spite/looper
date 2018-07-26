import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const mat = new THREE.MeshStandardMaterial({color:0xffffff, metalness: .3, roughness: .2});

const objects = [];

const MAX = 100;
const values = [];

values[0] = 0;
for (let i=1; i <MAX; i++) {
  let current = values[i-1] - i;
  let prev = values[i-1];

  for (let j=0; j < i; j++) {
    if( values[j] === current || current < 0){
      current = values[i-1]+i;
    }
  }
  values[i]=current;

  const d = current - prev;
  const r = .75 * d/2;

  const sampleClosedSpline = new THREE.CatmullRomCurve3( [
    new THREE.Vector3( -.5*d, 0, 0 ),
    new THREE.Vector3( -.25*d, .85*r, 0 ),
    new THREE.Vector3( 0, r, 0 ),
    new THREE.Vector3( .25*d, .85*r, 0 ),
    new THREE.Vector3( .5*d, 0, 0 )
  ] );
  sampleClosedSpline.curveType = 'catmullrom';

  const tubeGeometry = new THREE.TubeBufferGeometry( sampleClosedSpline, 100, 1 + Math.abs(.05 * r), 10, false );
  const m = mat.clone();
  m.color.setHSL(i/MAX,.5,.5);
  const mesh = new THREE.Mesh(
    tubeGeometry,
    m);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.position.x = -1 * MAX + prev  + .5*d;
  mesh.rotation.x = 0;
  mesh.position.z = - .5 * i;
  group.add(mesh);
  objects.push({mesh,x:mesh.position.x});
}
group.rotation.z = Maf.PI / 2;
group.scale.setScalar(.03);
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

camera.position.set(0,-5,9.5);
camera.lookAt(new THREE.Vector3(0,0,0));
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function myXOR(a,b) {
  return ( a || b ) && !( a && b );
}

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  const tt = easings.InOutCubic(t);
  objects.forEach( (o,id) => {
    o.mesh.position.y =  10 * Math.sin((.5+tt+Maf.parabola(tt,1)*id/MAX)*Maf.TAU);
  });
  camera.rotation.z = .1*Math.sin(t*Maf.TAU);

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
