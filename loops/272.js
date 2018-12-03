import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { Post } from '../modules/lines.js';

const canvas = renderer.domElement;
const camera = getOrthoCamera(1.25, 1.25);
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
  const p = this.from.clone().lerp(this.to, t).normalize();
  return p;
};

function addLine(from, to) {
  const curve = new CurvedLineCurve(from, to);
  const geometry = new THREE.TubeBufferGeometry(curve, 36, .003, 50, false);
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  return mesh;
}

const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });

const geo = new THREE.BoxBufferGeometry(1, 1, 1);
const pos = geo.attributes.position.array;
for (let j = 0; j < pos.length; j += 12) {
  const p1 = new THREE.Vector3(pos[j + 0], pos[j + 1], pos[j + 2]);
  const p2 = new THREE.Vector3(pos[j + 3], pos[j + 4], pos[j + 5]);
  const p3 = new THREE.Vector3(pos[j + 6], pos[j + 7], pos[j + 8]);
  const p4 = new THREE.Vector3(pos[j + 9], pos[j + 10], pos[j + 11]);
  const center = new THREE.Vector3().add(p1).add(p2).add(p3).add(p4).divideScalar(1 / 4);
  const dir1 = p1.clone().sub(center).normalize().multiplyScalar(.2);
  const dir2 = p2.clone().sub(center).normalize().multiplyScalar(.2);
  const dir3 = p3.clone().sub(center).normalize().multiplyScalar(.2);
  const dir4 = p4.clone().sub(center).normalize().multiplyScalar(.2);
  for (let k = 0; k < 5; k++) {
    p1.sub(dir1);
    p2.sub(dir2);
    p3.sub(dir3);
    p4.sub(dir4);
    addLine(p1, p2);
    addLine(p2, p4);
    addLine(p4, p3);
    addLine(p3, p1);
  }
}

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
    group.rotation.x = easings.InOutQuint(t2) * Maf.PI / 2;
  } else {
    const t2 = Maf.map(0, .5, 0, 1, t - .5);
    group.rotation.z = easings.InOutQuint(t2) * Maf.PI / 2;
  }

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };