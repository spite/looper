import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';

palette.range = ["#FD8401", "#F05B00", "#CF6826", "#FFDD5B"];
const palette2 = ["#2CD847", "#002701", "#1BA025", "#BEE518", "#2DC925", "#5F5A02"];

const gradient = new gradientLinear(palette.range);
const gradient2 = new gradientLinear(palette2);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);

camera.position.set(5.8, 5.2, -21);
camera.lookAt(group.position);
renderer.setClearColor(0, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/brush4.png');
const resolution = new THREE.Vector2(canvas.width, canvas.height);

function prepareMesh(points, w, color) {

  var geo = new Float32Array(points * 3);
  for (var j = 0; j < geo.length; j += 3) {
    geo[j] = geo[j + 1] = geo[j + 2] = 0;
  }

  var g = new MeshLine();
  g.setGeometry(geo, function(p) { return p; });

  const material = new MeshLineMaterial({
    map: strokeTexture,
    useMap: true,
    color,
    resolution: resolution,
    sizeAttenuation: true,
    lineWidth: w,
    near: camera.near,
    far: camera.far,
    //alphaTest: .75 * .5,
    depthWrite: false,
    depthTest: false,
    transparent: true,
    opacity: .75,
  });

  var mesh = new THREE.Mesh(g.geometry, material);
  mesh.geo = geo;
  mesh.g = g;

  return mesh;
}

const LINES = 10;
const meshes = [];
const stems = [];

for (let i = 0; i < LINES; i++) {
  const w = Maf.randomInRange(.1, 2);
  const radius = 7;
  const radius2 = Maf.randomInRange(3, 5);
  const color = Maf.randomInRange(0, 1);
  const offset = i * Maf.TAU / LINES;
  const range = .2;
  const points = 4 * Math.round(Maf.TAU * radius);
  const mesh = prepareMesh(points, w, gradient.getAt(color));
  group.add(mesh);
  meshes.push({
    mesh,
    radius,
    radius2,
    offset,
    range,
    loops: Math.round(Maf.randomInRange(1, 3)),
  });
  mesh.g.setGeometry(mesh.geo);
}

const STEMS = 5;
for (let i = 0; i < STEMS; i++) {
  const w = Maf.randomInRange(1, 3);
  const radius = Maf.randomInRange(10, 20);
  const radius2 = radius + Maf.randomInRange(-1, 1);
  const color = Maf.randomInRange(0, 1);
  const offset = Maf.randomInRange(0, Maf.TAU);
  const range = .1 * Maf.TAU;
  const points = 4 * Math.round(Maf.TAU * radius);
  const mesh = prepareMesh(points, w, gradient2.getAt(color));
  group.add(mesh);
  stems.push({
    mesh,
    radius,
    radius2,
    offset,
    range,
    loops: Math.round(Maf.randomInRange(1, 3)),
  });
  mesh.g.setGeometry(mesh.geo);
}
group.scale.setScalar(.5);
scene.add(group);

const loopDuration = 4;
const tmpVector = new THREE.Vector3();
const tmpMat = new THREE.Matrix4();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach((m, i) => {
    const geo = m.mesh.geo;
    const points = geo.length / 3;
    for (let i = 0, ptr = 0; i < points; i++) {
      const a = m.range * i * Maf.TAU / points + t * Maf.TAU + m.offset;
      const x = m.radius * Math.cos(a);
      const y = 0;
      const z = m.radius * Math.sin(a);
      const b = i * Maf.TAU / points + 4 * t * Maf.TAU;
      const r = m.radius2;
      tmpVector.set(
        r * Math.cos(b),
        r * Math.sin(b),
        0);
      tmpMat.makeRotationY(-a);
      tmpVector.applyMatrix4(tmpMat);
      geo[ptr + 0] = x + tmpVector.x;
      geo[ptr + 1] = y + tmpVector.y;
      geo[ptr + 2] = z + tmpVector.z;
      ptr += 3;
    }
    m.mesh.g.setGeometry(geo);
  });
  stems.forEach((m, i) => {
    const geo = m.mesh.geo;
    const points = geo.length / 3;
    for (let i = 0, ptr = 0; i < points; i++) {
      const a = m.range * i * Maf.TAU / points + t * Maf.TAU + m.offset;
      const x = m.radius * Math.cos(a);
      const y = 0;
      const z = m.radius * Math.sin(a);
      const b = i * Maf.TAU / points + 1 * t * Maf.TAU;
      const r = m.radius2;
      tmpVector.set(
        r * Math.cos(b),
        r * Math.sin(b),
        0);
      tmpMat.makeRotationY(-a);
      tmpVector.applyMatrix4(tmpMat);
      geo[ptr + 0] = x + tmpVector.x;
      geo[ptr + 1] = y + tmpVector.y;
      geo[ptr + 2] = z + tmpVector.z;
      ptr += 3;
    }
    m.mesh.g.setGeometry(geo, p => p - m.offset / Maf.TAU);
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };