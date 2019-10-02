import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import easings from '../modules/easings.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.1 });

palette.range = ["#ffffff"]; //, "#532DD8", "#EA44B6", "#371ABE", "#FAD1DF", "#520D28", "#E0123A"];

const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(15, 21, -3);
camera.lookAt(group.position);
renderer.setClearColor(0, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/brush4.png');
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const N = 400;
const LINES = 18;

const geo = new Float32Array(N * 3);
const radius = 2;
const lineWidth = 1;

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

const positions = [
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
];

const rotations = [
  new THREE.Euler(0, 0, Math.PI),
  new THREE.Euler(0, 0, 0),
  new THREE.Euler(0, 0, 0),
  new THREE.Euler(0, 0, 0),
  new THREE.Euler(0, 0, 0),
  new THREE.Euler(0, 0, 0),
]

const meshes = [];
for (let j = 0; j < LINES; j++) {
  const mesh = prepareMesh(lineWidth, Maf.randomInRange(0, 1));
  group.add(mesh);
  mesh.lookAt(positions[j % 6]);
  mesh.scale.setScalar(Maf.randomInRange(.95, 1.05));
  mesh.position.copy(positions[j % 6]).multiplyScalar(radius);
  const offset = Maf.randomInRange(0, Maf.TAU);
  meshes.push({ mesh, offset });
}
group.scale.setScalar(1.5);
scene.add(group);

const loopDuration = 8;
const r = 2;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach((m) => {
    const tt = Maf.mod(t + m.offset, 1);
    const l = easings.OutQuint(tt);
    const w = Maf.parabola(tt, 4);
    m.mesh.material.uniforms.lineWidth.value = 1 * w;
    const vertices = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {

      const p = 8;
      const theta = Maf.mod(m.offset + i * l * Maf.TAU / N + 2 * t * Maf.TAU, Maf.TAU);
      const r = (.95 * radius) * (1 / (Math.cos(theta) ** p + Math.sin(theta) ** p)) ** (1 / p)

      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = 0;

      vertices[i * 3] = x;
      vertices[i * 3 + 1] = y;
      vertices[i * 3 + 2] = z;
    }
    m.mesh.g.setGeometry(vertices);
  });

  group.rotation.x = t * Maf.TAU;
  group.rotation.y = t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };