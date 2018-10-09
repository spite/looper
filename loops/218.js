import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import perlin from '../third_party/perlin.js';
import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.5 });

palette.range = ["#FD7555", "#FE4F2E", "#040720", "#EB9786", "#E02211", "#3A0724", "#F9C163"];

const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);

camera.position.set(10, 10, -10);
camera.lookAt(group.position);
renderer.setClearColor(0xF2E9D9, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const resolution = new THREE.Vector2(canvas.width, canvas.height);
const strokeTexture = new THREE.TextureLoader().load('./assets/stroke.png');

const pivot = new THREE.Group();

const lines = [];
const LINES = 50;
for (let i = 0; i < LINES; i++) {

  const range = Maf.TAU * Maf.randomInRange(.025, .05);
  const points = Math.round(range * 200);
  var geo = new Float32Array(points * 3);
  for (var j = 0; j < geo.length; j += 3) {
    geo[j] = geo[j + 1] = geo[j + 2] = 0;
  }

  var g = new MeshLine();
  g.setGeometry(geo, function(p) { return p; });

  const material = new MeshLineMaterial({
    map: strokeTexture,
    useMap: true,
    color: gradient.getAt(i / LINES),
    resolution: resolution,
    sizeAttenuation: true,
    lineWidth: Maf.randomInRange(.5, 1),
    near: camera.near,
    far: camera.far,
    depthWrite: true,
    depthTest: true,
    transparent: true,
    opacity: .95,
    alphaTest: .5 * .95,
  });

  var mesh = new THREE.Mesh(g.geometry, material);
  mesh.geo = geo;
  mesh.g = g;
  mesh.frustumCulled = false;
  pivot.add(mesh);

  lines.push({ points, mesh, i, range, offset: .1 * Maf.randomInRange(0, Maf.TAU), frequency: .5 });
}
group.add(pivot);
scene.add(group);
group.scale.setScalar(.1);

const loopDuration = 4;

const target = new THREE.Vector3();

function fbm(x, y, z) {
  let value = 0.;
  let amplitude = 1.;
  for (let i = 0; i < 8; i++) {
    value += amplitude * Math.abs(perlin.perlin3(x, y, z));
    x *= 2.;
    y *= 2.;
    z *= 2.;
    amplitude *= .5;
  }
  return value;
}

function f(x, y, z) {
  const x2 = x;
  const y2 = y;
  const z2 = z;
  return 50 * fbm(x2, y2, z2); //10 * perlin.perlin3(x, y, z) + 5 * perlin.perlin3(x2, y2, z2);
}

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  lines.forEach((l, id) => {
    const geo = l.mesh.geo;
    const g = l.mesh.g;
    const r = 20 + 2 * id;
    const s = .1 * l.frequency * Maf.map(0, lines.length, .075, .1, id);
    const points = l.points;
    for (let j = 0; j < points; j++) {
      const y = 1;
      const a = l.range * j * Maf.TAU / points + t * Maf.TAU + l.offset;
      const x = r * Math.cos(a);
      const z = r * Math.sin(a);

      const v = f(s * x, s * y, s * z);
      geo[j * 3 + 0] = x;
      geo[j * 3 + 1] = v;
      geo[j * 3 + 2] = z;
    }
    g.setGeometry(geo);
  });

  const a = t * Maf.TAU;
  target.set(40 * Math.cos(a), 0, 40 * Math.sin(a));
  //  camera.lookAt(target);

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };