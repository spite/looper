import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import perlin from '../third_party/perlin.js';
import Painted from '../modules/painted.js';
import easings from '../modules/easings.js';

const painted = Painted(renderer, { minLevel: -.5 });

palette.range = ["#F62D62", "#FFFFFF", "#FDB600", "#F42D2D", "#544C98", "#ECACBC"];

const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);

camera.position.set(3.7, -12.7, 13);
camera.lookAt(group.position);
renderer.setClearColor(0xd0e6f9, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const resolution = new THREE.Vector2(canvas.width, canvas.height);
const strokeTexture = new THREE.TextureLoader().load('./assets/brush4.png');

const pivot = new THREE.Group();

const lines = [];
const LINES = 200;
for (let i = 0; i < LINES; i++) {

  const radius = 5 * Maf.parabola(i / LINES, 1);
  const range = Maf.randomInRange(.05, .25);
  const length = 3 * Maf.TAU * radius * range;
  const points = Math.round(2 * length);
  var geo = new Float32Array(points * 3);
  for (var j = 0; j < geo.length; j += 3) {
    geo[j] = geo[j + 1] = geo[j + 2] = 0;
  }

  var g = new MeshLine();
  g.setGeometry(geo, function(p) { return p; });

  const c = Maf.randomInRange(0, 1);
  const w = Maf.randomInRange(.1, 1);

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
  mesh.frustumCulled = false;
  pivot.add(mesh);
  mesh.rotation.set(Maf.randomInRange(-.1, .1), 0, Maf.randomInRange(-.1, .1));

  const speed = 1;
  lines.push({ radius, y: Maf.randomInRange(-1, 1), speed, points, mesh, i, range, offset: Maf.randomInRange(0, Maf.TAU), frequency: .5 });
}
group.add(pivot);
scene.add(group);
group.rotation.x = Maf.PI / 2;
group.scale.setScalar(.1);

const loopDuration = 3;

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
  const x2 = 10 + x;
  const y2 = y;
  const z2 = 20 + z;
  return 50 * fbm(x2, y2, z2); //10 * perlin.perlin3(x, y, z) + 5 * perlin.perlin3(x2, y2, z2);
}

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  lines.forEach((l, id) => {
    const geo = l.mesh.geo;
    const g = l.mesh.g;
    const s = .05 * l.frequency * Maf.map(0, lines.length, .075, .1, id);
    const points = l.points;
    for (let j = 0; j < points; j++) {
      const r = 10 + Maf.mod(t + l.offset, 1) * l.radius;
      const y = 1;
      const a = l.range * j * Maf.TAU / points + l.speed * t * Maf.TAU + l.offset;
      const x = r * Math.cos(a);
      const z = r * Math.sin(a);
      const v = 1 * f(s * x + l.offset, s * y, s * z);
      geo[j * 3 + 0] = x + v * Math.cos(a);
      geo[j * 3 + 1] = 20 * l.y * (.5 + .5 * Math.sin(t * Maf.TAU + l.offset));
      geo[j * 3 + 2] = z + v * Math.sin(a);
    }
    l.mesh.material.uniforms.lineWidth.value = easings.InOutQuad(Maf.parabola(Maf.mod(t + l.offset, 1), 1));
    g.setGeometry(geo);
  });

  //group.rotation.y = t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };