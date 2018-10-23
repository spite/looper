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

camera.position.set(5, -16, 10);
camera.lookAt(group.position);
renderer.setClearColor(0xd0e6f9, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const resolution = new THREE.Vector2(canvas.width, canvas.height);
const strokeTexture = new THREE.TextureLoader().load('./assets/brush4.png');

const pivot = new THREE.Group();

const lines = [];
const LINES = 20;
let radius = 5;
for (let i = 0; i < LINES; i++) {

  const range = Maf.randomInRange(.5, 1);
  const length = Maf.TAU * radius * range;
  const points = Math.round(length);
  var geo = new Float32Array(points * 3);
  for (var j = 0; j < geo.length; j += 3) {
    const a = j * Maf.TAU / geo.length;
    const x = radius * Math.cos(a);
    const z = radius * Math.sin(a);
    geo[j + 0] = x + Math.cos(a);
    geo[j + 1] = 0;
    geo[j + 2] = z + Math.sin(a);
  }

  var g = new MeshLine();
  g.setGeometry(geo);

  const c = Maf.randomInRange(0, 1);
  const w = Maf.randomInRange(.1, 1);
  radius += 4 * w;

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

  const speed = 1;
  lines.push({ radius, y: Maf.randomInRange(-1, 1), speed, points, mesh, i, range, offset: Maf.randomInRange(0, Maf.TAU), frequency: .5 });
}
group.add(pivot);
scene.add(group);
group.rotation.x = Maf.PI / 2;
group.scale.setScalar(.1);

const loopDuration = 3;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  lines.forEach((l, id) => {
    const geo = l.mesh.geo;
    const g = l.mesh.g;
    l.mesh.rotation.y = -(t * Maf.TAU - easings.InQuad(Maf.parabola(t, 1)) * id * Maf.PI / lines.length);
    l.mesh.position.y = 2 * Math.sin(t * Maf.TAU) * 5 * Maf.parabola(id / lines.length, 1);
  });

  group.rotation.y = -t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };