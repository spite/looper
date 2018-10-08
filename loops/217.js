import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { Curves } from '../third_party/THREE.CurveExtras.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.4 });

palette.range = ["#EDEBE7", "#13595A", "#DE1408", "#161814", "#E1610A", "#B7BDB3", "#9F9772"];

const gradient = new gradientLinear(palette.range);
const curve = new THREE.Curves.GrannyKnot();

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);

camera.position.set(-17, -22, -16);
camera.lookAt(group.position);
renderer.setClearColor(0xc6e0e4, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/stroke.png');
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const POINTS = 500;
const CIRCLE = 36;
const meshes = [];

function prepareMesh(w, c) {

  var geo = new Float32Array(POINTS * 3);
  for (var j = 0; j < geo.length; j += 3) {
    geo[j] = geo[j + 1] = geo[j + 2] = 0;
  }

  var g = new MeshLine();
  g.setGeometry(geo, function(p) { return p; });

  const material = new MeshLineMaterial({
    map: strokeTexture,
    useMap: true,
    color: gradient.getAt(Maf.randomInRange(0, 1)),
    resolution: resolution,
    sizeAttenuation: true,
    lineWidth: w,
    near: camera.near,
    far: camera.far,
    alphaTest: .85 * .5,
    depthWrite: !true,
    depthTest: !true,
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
  const base = new THREE.Group();
  const w = Maf.randomInRange(1.5, 2);
  const color = i / LINES;
  const offset = Maf.randomInRange(0, 1);
  const range = .5 * Maf.randomInRange(.2, .6);
  const mesh = prepareMesh(w, color);
  const pivot = new THREE.Group();
  const radius = Maf.randomInRange(2, 3);
  base.add(mesh);
  group.add(base);
  //mesh.position.set(Maf.randomInRange(-1, 1), Maf.randomInRange(-1, 1), Maf.randomInRange(-1, 1));
  meshes.push({
    mesh,
    radius,
    offset,
    range,
    speed: Math.floor(Maf.randomInRange(1, 2)),
    twistiness: .5 * Maf.randomInRange(.0025, .0075)
  });
}
group.scale.setScalar(.25);
scene.add(group);

const loopDuration = 5;

const mLookAt = new THREE.Matrix4();
const up = new THREE.Vector3(0, 1, 0);
const tmpVector = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach((m, i) => {
    const geo = m.mesh.geo;
    for (let i = 0, ptr = 0; i < POINTS; i++) {
      const t2 = (m.speed * t * Maf.TAU + .5 * m.range * i * Maf.TAU / POINTS + m.offset * Maf.TAU);
      const p = curve.getPoint(1 - Maf.mod(t2 / Maf.TAU, 1));
      const pp = curve.getPoint(1 - Maf.mod(t2 / Maf.TAU + 1 / POINTS, 1));
      const length = tmpVector.copy(pp).sub(p).length();
      up.copy(p).normalize();
      mLookAt.lookAt(p, pp, up);
      const a = m.twistiness * i * Maf.TAU + m.speed * 10 * t * Maf.TAU + m.offset;
      const r = m.radius;
      tmpVector.set(r * Math.cos(a), r * Math.sin(a), 0);
      tmpVector.applyMatrix4(mLookAt);
      geo[ptr + 0] = p.x + tmpVector.x;
      geo[ptr + 1] = p.y + tmpVector.y;
      geo[ptr + 2] = p.z + tmpVector.z;
      ptr += 3;
    }
    m.mesh.g.setGeometry(geo);
  });

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };