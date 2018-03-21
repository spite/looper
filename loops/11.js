import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import RoundedCylinderGeometry from '../modules/three-rounded-cylinder.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const circle = new THREE.Group();

const material = new THREE.MeshStandardMaterial({color: 0xb70000, metalness: .1, roughness: .1});

const cx = 2;
const cy = 0;
const r = .1;
const pts = [];
for (let a=0; a<2*Math.PI+.2; a+=.1) {
  const x = Math.pow(Math.abs(Math.cos(a)),.5)*r*Math.sign(Math.cos(a));
  const y = Math.pow(Math.abs(Math.sin(a)),.5)*r*Math.sign(Math.sin(a));
  pts.push(new THREE.Vector3(cx+x,cy+2*y,0));
}
var mesh = new THREE.Mesh( new THREE.LatheGeometry( pts, 72 ), material);
mesh.geometry.computeVertexNormals();
mesh.geometry.computeFaceNormals();
mesh.geometry.normalsNeedUpdate = true;
mesh.castShadow = mesh.receiveShadow = true;
mesh.rotation.x = Math.PI / 2;
circle.add(mesh);

const ptr = new THREE.Mesh(
  new RoundedCylinderGeometry(.25,10,.05),
  material.clone()
);
ptr.material.color.setHex(0x0000b7);
ptr.scale.setScalar(.25);
ptr.position.z = -1.25;
ptr.position.y = 2.125;
ptr.castShadow = ptr.receiveShadow = true;
circle.add(ptr);

group.add( circle );

const lines = new THREE.Group();
const lineLength = 2*2*Math.PI;
const lineMaterial = material.clone();
lineMaterial.color.setHex(0x33a53c)
const lineGeometry = new RoundedBoxGeometry(lineLength,.125,.5,.05,2);
const line1 = new THREE.Mesh(
  lineGeometry,
  lineMaterial
);
line1.castShadow = line1.receiveShadow = true;
line1.scale.setScalar(.99);
lines.add(line1);
const line2 = new THREE.Mesh(
  lineGeometry,
  lineMaterial
);
line2.scale.setScalar(.99);
line2.castShadow = line2.receiveShadow = true;
lines.add(line2);
const line3 = new THREE.Mesh(
  lineGeometry,
  lineMaterial
);
line3.scale.setScalar(.99);
line3.castShadow = line3.receiveShadow = true;
lines.add(line3);
lines.position.y = 2.1;
group.add(lines);
scene.add(group);
group.rotation.x = Math.PI / 2;

const pivotText = new THREE.Group();
const loader = new THREE.FontLoader();
loader.load( './fonts/helvetiker_regular.typeface.json', function ( font ) {

  const textGeo = new THREE.TextGeometry( 'π', {
    font: font,
    size: 2,
    height: 1,
    curveSegments: 10,
    bevelThickness: .05,
    bevelSize: .05,
    bevelSegments: 5,
    bevelEnabled: true
  });
  textGeo.computeBoundingBox();
  textGeo.computeVertexNormals();
  textGeo.computeFaceNormals();

  const text = new THREE.Mesh( textGeo, material.clone() );
  text.material.color.setHex(0x40daff);
  text.material.roughness = .2;
  text.castShadow = text.receiveShadow = true;
  text.position.x = -.75;
  text.position.y = -.75;
  text.position.z = -.5;
  text.rotation.x = -.1;
  pivotText.add(text);
  pivotText.lookAt(camera.position);
  scene.add(pivotText);
});

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

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  circle.rotation.z = -time * 2 * Math.PI / loopDuration;
  line1.position.x = time * lineLength / loopDuration - .5*lineLength;
  line2.position.x = time * lineLength / loopDuration - 1.5*lineLength;
  line3.position.x = time * lineLength / loopDuration + .5*lineLength;

  group.rotation.y = .3;
  group.rotation.z = Math.PI / 2 - 0* Math.PI/4;
  group.rotation.x = -Math.PI / 8;
  group.rotation.y = time * 2 * Math.PI / loopDuration;

  //const d = 10 + 6 * easings.InOutBack(.5 + .5 * Math.sin(time * 2 * Math.PI / loopDuration - Math.PI/2),2);
  //camera.position.normalize().multiplyScalar(d);

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
