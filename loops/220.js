import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.2 });

palette.range = ["#FF1A1C", "#FF5122", "#FF5151", "#9A2916", "#FF9A51", "#FF9A9A", "#FF3A9A"]; //["#222222", "#444444"];

const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);

camera.position.set(12, -5, -35);
camera.lookAt(group.position);
renderer.setClearColor(0xEABA6D, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/stroke.png');
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const meshes = [];

function prepareMesh(points, w, c) {

  var geo = new Float32Array(points * 3);
  for (var j = 0; j < geo.length; j += 3) {
    geo[j] = geo[j + 1] = geo[j + 2] = 0;
  }

  var g = new MeshLine();
  g.setGeometry(geo, function(p) { return p; });

  const material = new MeshLineMaterial({
    map: strokeTexture,
    useMap: true,
    color: gradient.getAt(c),
    resolution: resolution,
    sizeAttenuation: true,
    lineWidth: w,
    near: camera.near,
    far: camera.far,
    alphaTest: .85 * .5,
    depthWrite: true,
    depthTest: true,
    transparent: true,
    opacity: .85,
  });

  var mesh = new THREE.Mesh(g.geometry, material);
  mesh.geo = geo;
  mesh.g = g;

  return mesh;
}

const LINES = 20;

for (let i = 0; i < LINES; i++) {
  const w = .1 * i;
  const radius = .5 * i;
  const radius2 = .1 * i;
  const color = Maf.randomInRange(0, 1);
  const offset = Maf.randomInRange(0, Maf.TAU);
  const range = 1;
  const points = 4 * Math.round(Maf.TAU * radius);
  const mesh = prepareMesh(points, w, color);
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
  mesh.position.set(0, -(i - .5 * LINES), 0);
}
group.scale.setScalar(.75);
scene.add(group);

const loopDuration = 3;
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
      const b = m.loops * (m.range * i * Maf.TAU / points + t * Maf.TAU);
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

  group.rotation.y = t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };