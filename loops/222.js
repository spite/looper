import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { Curves } from '../third_party/THREE.CurveExtras.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.3 });

palette.range = ["#BB2508", "#480607", "#230306", "#DECCC9", "#FD6202", "#6E5053", "#A8605D", "#FCAD49"];

const gradient = new gradientLinear(palette.range);
const curve = new THREE.Curves.TrefoilKnot();

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);

camera.position.set(15, 21, -3);
camera.lookAt(group.position);
renderer.setClearColor(0xfdf1cd, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/stroke.png');
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const POINTS = 200;
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
    color: new THREE.Color(palette.range[c]),
    resolution: resolution,
    sizeAttenuation: true,
    lineWidth: w,
    near: camera.near,
    far: camera.far,
    alphaTest: .75 * .5,
    depthWrite: true,
    depthTest: true,
    transparent: true,
    opacity: .75,
  });

  var mesh = new THREE.Mesh(g.geometry, material);
  mesh.geo = geo;
  mesh.g = g;

  return mesh;
}

const spread = 1.2;
const LINES = 40;
const REPEAT = 3;
for (let i = 0; i < LINES; i++) {
  const w = 1 * Maf.randomInRange(.8, 1.2);
  const radius = .05 * Maf.randomInRange(4.5, 5.5);
  const color = i % palette.range.length;
  const offset = Maf.randomInRange(0, Maf.TAU / 6);
  const range = Maf.TAU / 6; //Maf.randomInRange(Maf.TAU / 16, Maf.TAU / 8);
  const x = Maf.randomInRange(-spread, spread);
  const y = Maf.randomInRange(-spread, spread);
  const z = Maf.randomInRange(-spread, spread);
  for (let j = 0; j < REPEAT; j++) {
    const mesh = prepareMesh(w, color);
    mesh.position.set(x, y, z);
    group.add(mesh);
    meshes.push({
      mesh,
      radius,
      offset: offset + j * Maf.TAU / 3,
      range,
    });
  }
}
group.scale.setScalar(.75);
scene.add(group);

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach((m) => {
    const geo = m.mesh.geo;
    const g = m.mesh.g;
    const range = m.range;
    const r = m.radius;
    for (var j = 0; j < geo.length; j += 3) {
      const t2 = (t * Maf.TAU + j * range / geo.length + m.offset);
      const p = curve.getPoint(1 - Maf.mod(t2 / Maf.TAU, 1));
      geo[j] = r * p.x;
      geo[j + 1] = r * p.y;
      geo[j + 2] = r * p.z;
    }
    g.setGeometry(geo);
  });

  group.rotation.y = t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };