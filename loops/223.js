import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { Curves } from '../third_party/THREE.CurveExtras.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.1 });

palette.range = ["#F62D62", "#FFFFFF", "#FDB600", "#F42D2D", "#544C98", "#ECACBC"];

const gradient = new gradientLinear(palette.range);
const curve = new THREE.Curves.KnotCurve();

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(15, 21, -3);
camera.lookAt(group.position);
renderer.setClearColor(0xd0e6f9, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/brush4.png');
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const POINTS = 100;
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
    color: gradient.getAt(c),
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
const LINES = 80;
const REPEAT = 3;
for (let i = 0; i < LINES; i++) {
  const w = 1 * Maf.randomInRange(.8, 1.2);
  const radius = .05 * Maf.randomInRange(4.5, 5.5);
  const color = Maf.randomInRange(i / LINES, (i + 1) / LINES);
  const offset = Maf.randomInRange(0, Maf.TAU); //Maf.randomInRange(0, ((i + 1) / LINES) * Maf.TAU / (2 * REPEAT));
  const range = ((i + 1) / LINES) * Maf.TAU / (2 * REPEAT);
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
      offset: offset + j * Maf.TAU / REPEAT,
      range,
    });
  }
}
group.scale.setScalar(.45);
group.position.y = -1;
scene.add(group);

const loopDuration = 3.3;

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

  //group.rotation.x = t * Maf.TAU;
  group.rotation.y = t * Maf.TAU;
  //group.rotation.z = t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };