import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.2 });

palette.range = ["#F62D62", "#FFFFFF", "#FDB600", "#F42D2D", "#544C98", "#ECACBC"];

const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);

camera.position.set(-6.8, 7.4, 7.1);
camera.lookAt(group.position);
renderer.setClearColor(0xF2E9D9, 1);

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
    useMap: true,
    map: strokeTexture,
    color: gradient.getAt(c),
    opacity: .9,
    resolution: resolution,
    sizeAttenuation: true,
    lineWidth: w,
    near: camera.near,
    far: camera.far,
    depthTest: false,
    blending: THREE.NormalBlending,
    transparent: true,
    opacity: .75,
    alphaTest: .75 * .5,
  });

  var mesh = new THREE.Mesh(g.geometry, material);
  mesh.geo = geo;
  mesh.g = g;

  return mesh;
}


/*const a = Math.round(Maf.randomInRange(2, 5));
const b = Math.round(Maf.randomInRange(2, 5));
const c = Math.round(Maf.randomInRange(2, 5));
const d = Math.round(Maf.randomInRange(2, 5));
const e = Math.round(Maf.randomInRange(2, 5));
console.log(a, b, c, d, e);*/

const a = 2;
const b = 4;
const c = 4;
const d = 4;
const e = 3;
// 2 5 4 5 4
// 2 4 4 4 3

const STEPS = 10;
const COPIES = 3;
for (let i = 0; i < STEPS; i++) {
  const c = Maf.randomInRange(0, 1);
  for (let j = 0; j < COPIES; j++) {
    const color = c + Maf.randomInRange(-.05, .05);
    const offset = (i * Maf.TAU / STEPS) + Maf.randomInRange(-.1, .1);
    const range = (Maf.TAU / STEPS) + Maf.randomInRange(-.1, .1);
    const radius = Maf.randomInRange(.8, 1.2) + .1 * j;
    const w = Maf.randomInRange(.8, 1.2) - .1 * j;
    const mesh = prepareMesh(w, color);
    group.add(mesh);
    meshes.push({
      mesh,
      radius,
      offset,
      range,
      a,
      b,
      c,
      d,
      e,
    });
  }
}
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
      const t2 = Maf.TAU - (t * Maf.TAU + j * range / geo.length + m.offset);
      const x = r * Math.cos(m.a * t2) + r * Math.cos(m.b * t2);
      const y = r * Math.sin(m.a * t2) + r * Math.sin(m.d * t2);
      const z = 2 * r * Math.sin(m.e * t2);
      geo[j] = x;
      geo[j + 1] = y;
      geo[j + 2] = z;
    }
    g.setGeometry(geo);
  });

  group.rotation.y = t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };