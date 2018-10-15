import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import pointsOnSphere from '../modules/points-sphere.js';
import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.1 });

palette.range = ["#F62D62", "#FFFFFF", "#FDB600", "#F42D2D", "#544C98", "#ECACBC"];

const gradient = new gradientLinear(palette.range);

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

const CIRCLES = 40;
const points = pointsOnSphere(CIRCLES);

const POINTS = 50;

const geo = new Float32Array(POINTS * 3);
for (var j = 0; j < geo.length; j += 3) {
  const a = j * Maf.TAU / geo.length;
  const r = 1.5;
  const x = r * Math.cos(a);
  const y = r * Math.sin(a);
  const z = 0;
  geo[j] = x;
  geo[j + 1] = y;
  geo[j + 2] = z;
}

function prepareMesh(w, c) {

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

const meshes = [];
const REPEAT = 10;
for (let j = 0; j < CIRCLES; j++) {
  const position = points[j].multiplyScalar(5);
  const dir = position.clone().normalize();
  for (let k = 0; k < REPEAT; k++) {
    const d = dir.clone().multiplyScalar(1 + .1 * k);
    const mesh = prepareMesh(.5, Maf.randomInRange(0, 1));
    mesh.position.copy(position);
    mesh.position.add(d);
    mesh.lookAt(group.position);
    mesh.scale.setScalar(1 - k / REPEAT);
    group.add(mesh);
    const offset = Maf.randomInRange(0, Maf.TAU);
    meshes.push({ mesh, offset, position, dir, k });
  }
}
group.scale.setScalar(.75);
scene.add(group);

const loopDuration = 2.5;
const dir = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach((m) => {
    m.mesh.rotation.z = m.offset + 2 * t * Maf.TAU;
  })

  group.rotation.y = t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };