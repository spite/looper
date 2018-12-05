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

const points = pointsOnSphere(100);

function CurvedLineCurve(from, to) {
  THREE.Curve.call(this);
  this.from = from;
  this.to = to;
}

CurvedLineCurve.prototype = Object.create(THREE.Curve.prototype);
CurvedLineCurve.prototype.constructor = CurvedLineCurve;

CurvedLineCurve.prototype.getPoint = function(t) {
  const p = this.from.clone().lerp(this.to, t).normalize().multiplyScalar(1);
  return p;
};

function addLine(from, to, material) {
  const curve = new CurvedLineCurve(from, to);
  const geometry = new THREE.TubeBufferGeometry(curve, 10, .0075, 20, false);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

const groups = [];

function addTriangle(p1, p2, p3) {
  const m = material.clone();
  const center = new THREE.Vector3().add(p1).add(p2).add(p3).divideScalar(1 / 3);
  const dir = center.normalize();
  const g = new THREE.Group();
  g.add(addLine(p1, p2, m));
  g.add(addLine(p2, p3, m));
  g.add(addLine(p3, p1, m));
  group.add(g);
  groups.push({
    group: g,
    axis: dir
  });
}
const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true });

const up = new THREE.Vector3(0, 1, 0);
for (const point of points) {
  const n = point.clone().normalize();
  const t = n.clone().cross(up).normalize().multiplyScalar(.2);
  const b = t.clone().cross(n).normalize();
  const p1 = t.clone().applyAxisAngle(n, 0).add(point);
  const p2 = t.clone().applyAxisAngle(n, 1 * Maf.TAU / 3).add(point);
  const p3 = t.clone().applyAxisAngle(n, 2 * Maf.TAU / 3).add(point);
  const g = new THREE.Group();
  addTriangle(p1, p2, p3);
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

camera.position.set(0, 1, 5);
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

  groups.forEach((g, i) => {
    const t2 = Maf.mod(t + i / groups.length, 1);
    if (t2 < .5) {
      const tt = Maf.map(0, .5, 0, 1, t2);
      q.setFromAxisAngle(g.axis, easings.InOutQuint(tt) * Maf.TAU / 3);
      g.group.quaternion.copy(q);
      g.group.scale.setScalar(1);
      g.group.position.set(0, 0, 0);
    } else {
      q.setFromAxisAngle(g.axis, 0);
      g.group.quaternion.copy(q);
      const tt = Maf.map(0, .5, 0, 1, t2 - .5);
      const s = 1 - easings.InOutQuad(Maf.parabola(tt, 1));
      g.visible = s < .00001;
      g.group.scale.setScalar(s);
      p.copy(points[i]).multiplyScalar(1 - s);
      g.group.position.set(0, 0, 0).add(p);
    }
  });

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };