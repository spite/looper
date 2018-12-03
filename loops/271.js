import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { Post } from '../modules/lines.js';

const canvas = renderer.domElement;
const camera = getOrthoCamera(2, 2);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const post = new Post(renderer);


function CurvedLineCurve(from, to) {
  THREE.Curve.call(this);
  this.from = from;
  this.to = to;
}

CurvedLineCurve.prototype = Object.create(THREE.Curve.prototype);
CurvedLineCurve.prototype.constructor = CurvedLineCurve;

CurvedLineCurve.prototype.getPoint = function(t) {
  const p = this.from.clone().lerp(this.to, t);
  return p;
};


function addLine(from, to) {
  const curve = new CurvedLineCurve(from, to);
  const geometry = new THREE.TubeBufferGeometry(curve, 36, .005, 50, false);
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  return mesh;
}

function createGroup() {
  const g = new THREE.Group();
  [...arguments].forEach((a) => {
    g.add(a)
  });
  return g;
}

const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const h = 1.;
const g1 = createGroup(
  addLine(new THREE.Vector3(-.5, h, -.5), new THREE.Vector3(.5, h, -.5)),
  addLine(new THREE.Vector3(.5, h, -.5), new THREE.Vector3(.5, h, .5)),
  addLine(new THREE.Vector3(.5, h, .5), new THREE.Vector3(-.5, h, .5)),
  addLine(new THREE.Vector3(-.5, h, .5), new THREE.Vector3(-.5, h, -.5)),
);
group.add(g1);

addLine(new THREE.Vector3(-.5, -h, -.5), new THREE.Vector3(.5, -h, -.5));
addLine(new THREE.Vector3(.5, -h, -.5), new THREE.Vector3(.5, -h, .5));
addLine(new THREE.Vector3(.5, -h, .5), new THREE.Vector3(-.5, -h, .5));
addLine(new THREE.Vector3(-.5, -h, .5), new THREE.Vector3(-.5, -h, -.5));

addLine(new THREE.Vector3(-h, -.5, .5), new THREE.Vector3(-h, -.5, -.5));
addLine(new THREE.Vector3(-h, -.5, -.5), new THREE.Vector3(-h, .5, -.5));
addLine(new THREE.Vector3(-h, .5, -.5), new THREE.Vector3(-h, .5, .5));
addLine(new THREE.Vector3(-h, .5, .5), new THREE.Vector3(-h, -.5, .5));

addLine(new THREE.Vector3(h, -.5, .5), new THREE.Vector3(h, -.5, -.5));
addLine(new THREE.Vector3(h, -.5, -.5), new THREE.Vector3(h, .5, -.5));
addLine(new THREE.Vector3(h, .5, -.5), new THREE.Vector3(h, .5, .5));
addLine(new THREE.Vector3(h, .5, .5), new THREE.Vector3(h, -.5, .5));

addLine(new THREE.Vector3(.5, -.5, h), new THREE.Vector3(-.5, -.5, h));
addLine(new THREE.Vector3(-.5, -.5, h), new THREE.Vector3(-.5, .5, h));
addLine(new THREE.Vector3(-.5, .5, h), new THREE.Vector3(.5, .5, h));
addLine(new THREE.Vector3(.5, .5, h), new THREE.Vector3(.5, -.5, h));

addLine(new THREE.Vector3(.5, -.5, -h), new THREE.Vector3(-.5, -.5, -h));
addLine(new THREE.Vector3(-.5, -.5, -h), new THREE.Vector3(-.5, .5, -h));
addLine(new THREE.Vector3(-.5, .5, -h), new THREE.Vector3(.5, .5, -h));
addLine(new THREE.Vector3(.5, .5, -h), new THREE.Vector3(.5, -.5, -h));

group.rotation.set(Maf.PI / 3.3, 0, Maf.PI / 4);
window.group = group;
scene.add(group);

const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
directionalLight.position.set(-2, 2, 2);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = -1;
directionalLight.shadow.camera.far = 10;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
directionalLight2.shadow.camera.near = -4;
directionalLight2.shadow.camera.far = 10;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(0x776E88, 0xffffff, .5);
scene.add(light);

camera.position.set(0, 0, 5);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  if (t < .5) {
    const t2 = Maf.map(0, .5, 0, 1, t);
    group.rotation.z = Maf.PI / 4 + easings.InOutQuint(t2) * Maf.PI / 2;
  } else {
    const t2 = Maf.map(0, .5, 0, 1, t - .5);
    group.rotation.x = Maf.PI / 3.3 + easings.InOutQuint(t2) * Maf.PI / 2.54;
  }

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };