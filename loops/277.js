import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { Post } from '../modules/lines.js';
import pointsOnSphere from '../modules/points-sphere.js';

const canvas = renderer.domElement;
const camera = getOrthoCamera(1.5, 1.5);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const post = new Post(renderer, { minLeveL: 0, maxLevel: .5 });

const points = pointsOnSphere(10);

function LineOfPoints(points) {
  THREE.Curve.call(this);
  this.points = points;
}

LineOfPoints.prototype = Object.create(THREE.Curve.prototype);
LineOfPoints.prototype.constructor = LineOfPoints;

LineOfPoints.prototype.getPoint = function(t) {
  const fromIdx = ~~(t * (this.points.length - 2));
  const toIdx = fromIdx + 1;
  const from = this.points[fromIdx];
  const to = this.points[toIdx];
  const tt = Maf.map(0, 1, fromIdx, toIdx, t);
  const p = from.clone().lerp(to, t);
  return p;
};

function addLine(points, material) {
  const curve = new LineOfPoints(points);
  const geometry = new THREE.TubeBufferGeometry(curve, points.length - 1, .01, 4, false);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

const groups = [];

const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true });

const r = .75;
const r2 = .5;

function getPoint(a, a2) {
  const x = r * Math.cos(a);
  const y = 0;
  const z = r * Math.sin(a);
  const x2 = r2 * Math.cos(a2);
  const y2 = r2 * Math.sin(a2);
  const z2 = 0;
  const p = new THREE.Vector3(x2, y2, z2);
  p.applyAxisAngle(up, -a);
  p.x += x;
  p.y += y;
  p.z += z;
  return p;
}

const SIDES1 = 10;
const SIDES2 = 6;
const INC = 10;
const padding = Maf.TAU / 15;

const rings = [];
const circles = [];

const up = new THREE.Vector3(0, 1, 0);
for (let a = 0; a < Maf.TAU; a += Maf.TAU / SIDES1) {
  for (let a2 = 0; a2 < Maf.TAU; a2 += Maf.TAU / SIDES2) {
    for (let a3 = a2 + padding / SIDES2; a3 < a2 + Maf.TAU / SIDES2 - 2 * padding / SIDES2; a3 += (Maf.TAU - 2 * padding) / (SIDES2 * INC)) {
      const from = getPoint(a, a3);
      const to = getPoint(a, a3 + Maf.TAU / (SIDES2 * INC));
      const g = addLine([from, to], material);
      group.add(g);
      rings.push({ group: g, angle: a });
    }
    for (let a3 = a + padding / SIDES1; a3 < a + Maf.TAU / SIDES1 - 2 * padding / SIDES1; a3 += (Maf.TAU - 2 * padding) / (SIDES1 * INC)) {
      const from = getPoint(a3, a2);
      const to = getPoint(a3 + Maf.TAU / (SIDES1 * INC), a2);
      const g = addLine([from, to], material);
      group.add(g);
      circles.push({ group: g, angle: a2 });
    }
  }
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

camera.position.set(-1.375343675934189, 3.9021520366916516, 2.807425734656406);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0, 1);
scene.fog = new THREE.FogExp2(0, .2);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const q = new THREE.Quaternion();
const m = new THREE.Matrix4();
const p = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  const a = Maf.PI / SIDES1;
  rings.forEach((g, i) => {
    g.group.rotation.y = easings.InOutQuint(Maf.mod(2 * t, 1)) * a + ~~(2 * t) * a;
  });
  circles.forEach((g, i) => {
    g.group.rotation.y = -easings.InOutQuint(Maf.mod(2 * t, 1)) * Maf.PI / SIDES1 - ~~(2 * t) * a;
  });
  group.rotation.y = easings.Linear(Maf.mod(t + .5, 1)) * Maf.TAU / SIDES1;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };