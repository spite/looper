import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { Post } from '../modules/lines.js';

const canvas = renderer.domElement;
const camera = getOrthoCamera(1.5, 1.5);
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
  const geometry = new THREE.TubeBufferGeometry(curve, 36, .0025, 5, false);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });

const groups = [];
const group1 = new THREE.Group();
const geo = new THREE.IcosahedronBufferGeometry(1, 1);
const pos = geo.attributes.position.array;
for (let j = 0; j < pos.length; j += 9) {
  const p1 = new THREE.Vector3(pos[j + 0], pos[j + 1], pos[j + 2]);
  const p2 = new THREE.Vector3(pos[j + 3], pos[j + 4], pos[j + 5]);
  const p3 = new THREE.Vector3(pos[j + 6], pos[j + 7], pos[j + 8]);
  const center = new THREE.Vector3().add(p1).add(p2).add(p3).divideScalar(1 / 3);
  const dir1 = p1.clone().sub(center).normalize().multiplyScalar(.25);
  const dir2 = p2.clone().sub(center).normalize().multiplyScalar(.25);
  const dir3 = p3.clone().sub(center).normalize().multiplyScalar(.25);
  p1.sub(dir1);
  p2.sub(dir2);
  p3.sub(dir3);
  const g = new THREE.Group();
  g.add(addLine(p1, p2));
  g.add(addLine(p2, p3));
  g.add(addLine(p3, p1));
  group.add(g);
  groups.push({
    g,
    id: ~~Maf.randomInRange(0, 3)
  });
}

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

camera.position.set(0, 5, 1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0, 1);
scene.fog = new THREE.FogExp2(0, .2);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  groups.forEach((g, i) => {
    const tt = easings.InOutQuint(Maf.smoothStep(0, 1, Maf.mod(t + g.id * .1, 1)));
    g.g.scale.setScalar(1 + .1 * Maf.parabola(tt, 1));
  });
  group.rotation.z = t * Maf.PI;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };