import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
directionalLight.position.set(-2, 2, 2);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = .1;
directionalLight.shadow.camera.far = 6;
directionalLight.shadow.bias = 0.0001;
directionalLight.shadow.radius = 1;

scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight2.position.set(0, 3, -6);
directionalLight2.castShadow = true;
directionalLight2.shadow.camera.near = .1;
directionalLight2.shadow.camera.far = 5;
directionalLight2.shadow.bias = 0.0001;
scene.add(directionalLight2);
//var helper = new THREE.CameraHelper(directionalLight2.shadow.camera);
//scene.add(helper);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(0x776E88, 0xffffff, .5);
scene.add(light);

camera.position.set(0, 6, 6);
camera.lookAt(group.position);
renderer.setClearColor(0, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Codevember - Geometric

const up = new THREE.Vector3(0, 1, 0);
const meshes = [];

const a = new THREE.Vector3();
const b = new THREE.Vector3();
const c = new THREE.Vector3();

const material = new THREE.MeshStandardMaterial({ roughness: .4, metalness: .1, color: 0xffb330, wireframe: !true, }); //  side: THREE.DoubleSide });
const rot = new THREE.Matrix4().makeRotationX(Math.PI / 2);
const m = new THREE.Matrix4();

const r = .04;

let currentGeometries = [];

function meshOpen(x0, y0, z0) {
  currentGeometries = [];
}

function cylinder(x1, y1, z1, x2, y2, z2) {
  a.set(x1, y1, z1);
  b.set(x2, y2, z2);
  const d = a.distanceTo(b);
  const g = new THREE.BufferGeometry().fromGeometry(new THREE.CylinderGeometry(r, r, d, 36, 1, true));
  g.applyMatrix(rot);
  m.identity().lookAt(a, b, up);
  g.applyMatrix(m);
  c.copy(b).sub(a).multiplyScalar(.5).add(a);
  m.identity().makeTranslation(c.x, c.y, c.z);
  g.applyMatrix(m);
  currentGeometries.push(g);
}

function meshClose(x0, y0, z0) {
  const count = currentGeometries.reduce((ac, v) => {
    return ac + v.attributes.position.count;
  }, 0);
  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

  let offset = 0;
  currentGeometries.forEach((g) => {
    geometry.merge(g, offset);
    offset += g.attributes.position.count;
  });
  m.identity().makeTranslation(x0, y0, z0);
  geometry.applyMatrix(m);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function node(x, y, z) {
  const g = new THREE.BufferGeometry().fromGeometry(new THREE.IcosahedronGeometry(r, 2));
  m.identity().makeTranslation(x, y, z);
  g.applyMatrix(m);
  currentGeometries.push(g);
}

function plane(coords) {
  c.set(0, 0, 0);
  for (let i = 0; i < coords.length; i += 3) {
    c.x += coords[i];
    c.y += coords[i + 1];
    c.z += coords[i + 2];
  }
  c.multiplyScalar(1 / (coords.length / 3));
  const d = c.clone().normalize().multiplyScalar(r);
  //d.set(0, 0, 0);
  c.add(d);
  //node(c.x, c.y, c.z);

  for (let i = 0; i < coords.length; i += 3) {
    a.x = coords[i] + d.x;
    a.y = coords[i + 1] + d.y;
    a.z = coords[i + 2] + d.z;
    b.x = coords[(i + 3) % coords.length] + d.x;
    b.y = coords[(i + 4) % coords.length] + d.y;
    b.z = coords[(i + 5) % coords.length] + d.z;
    triangle(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
}

function triangle(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
  const g = new THREE.BufferGeometry();
  a.set(x1, y1, z1);
  b.set(x2, y2, z2);
  c.set(x3, y3, z3);
  const u = b.clone().sub(a);
  const v = c.clone().sub(a);
  const n = u.cross(v).normalize();
  const normalData = Float32Array.from([n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z]);
  const data = Float32Array.from([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z]);
  g.addAttribute('position', new THREE.BufferAttribute(data, 3));
  g.addAttribute('normal', new THREE.BufferAttribute(normalData, 3));
  currentGeometries.push(g);
}

/*// pyramid

meshOpen();

cylinder(0, 0, 0, 1, 0, 0);
cylinder(1, 0, 0, 1, 0, 1);
cylinder(1, 0, 1, 0, 0, 1);
cylinder(0, 0, 1, 0, 0, 0);

cylinder(0, 0, 0, .5, 1, .5);
cylinder(1, 0, 0, .5, 1, .5);
cylinder(1, 0, 1, .5, 1, .5);
cylinder(0, 0, 1, .5, 1, .5);

node(0, 0, 0);
node(1, 0, 0);
node(1, 0, 1);
node(0, 0, 1);
node(.5, 1, .5);

plane([0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1]);
plane([0, 0, 0, 1, 0, 0, .5, 1, .5]);
plane([1, 0, 0, 1, 0, 1, .5, 1, .5]);
plane([1, 0, 1, 0, 0, 1, .5, 1, .5]);
plane([0, 0, 1, 0, 0, 0, .5, 1, .5]);

const pyramid = meshClose(-.5, -.5, -.5);
pyramid.position.x = -1.5;
scene.add(pyramid);
*/

// tetraheadron
meshOpen();

const sq3 = 1 / Math.sqrt(3);
const sq6 = 1 / Math.sqrt(6);
const tetraheadronVertices = [1, -sq3, -sq6, -1, -sq3, -sq6, 0, 2 * sq3, -sq6, 0, 0, 3 * sq6].map((v) => v *= .5);

function tetrahedronCoords(i) {
  const x = tetraheadronVertices[i * 3];
  const y = tetraheadronVertices[i * 3 + 1];
  const z = tetraheadronVertices[i * 3 + 2];
  return [x, y, z];
}

cylinder(...tetrahedronCoords(0), ...tetrahedronCoords(1));
cylinder(...tetrahedronCoords(1), ...tetrahedronCoords(2));
cylinder(...tetrahedronCoords(2), ...tetrahedronCoords(3));
cylinder(...tetrahedronCoords(0), ...tetrahedronCoords(2));
cylinder(...tetrahedronCoords(0), ...tetrahedronCoords(3));
cylinder(...tetrahedronCoords(1), ...tetrahedronCoords(3));

node(...tetrahedronCoords(0));
node(...tetrahedronCoords(1));
node(...tetrahedronCoords(2));
node(...tetrahedronCoords(3));

plane([...tetrahedronCoords(0), ...tetrahedronCoords(1), ...tetrahedronCoords(2)]);
plane([...tetrahedronCoords(3), ...tetrahedronCoords(2), ...tetrahedronCoords(1)]);
plane([...tetrahedronCoords(2), ...tetrahedronCoords(3), ...tetrahedronCoords(0)]);
plane([...tetrahedronCoords(1), ...tetrahedronCoords(0), ...tetrahedronCoords(3)]);

const tetrahedron = meshClose(0, 0, 0);
tetrahedron.rotation.x = -Math.PI / 2;
tetrahedron.position.x = 1.5;
group.add(tetrahedron);

// cube

meshOpen();

const cubeVertices = [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1].map((v) => v - .5);

function cubeCoords(i) {
  const x = cubeVertices[i * 3];
  const y = cubeVertices[i * 3 + 1];
  const z = cubeVertices[i * 3 + 2];
  return [x, y, z];
}

cylinder(...cubeCoords(0), ...cubeCoords(1));
cylinder(...cubeCoords(1), ...cubeCoords(2));
cylinder(...cubeCoords(2), ...cubeCoords(3));
cylinder(...cubeCoords(3), ...cubeCoords(0));

cylinder(...cubeCoords(4), ...cubeCoords(5));
cylinder(...cubeCoords(5), ...cubeCoords(6));
cylinder(...cubeCoords(6), ...cubeCoords(7));
cylinder(...cubeCoords(7), ...cubeCoords(4));

cylinder(...cubeCoords(0), ...cubeCoords(4));
cylinder(...cubeCoords(1), ...cubeCoords(5));
cylinder(...cubeCoords(2), ...cubeCoords(6));
cylinder(...cubeCoords(3), ...cubeCoords(7));

node(...cubeCoords(0));
node(...cubeCoords(1));
node(...cubeCoords(2));
node(...cubeCoords(3));

node(...cubeCoords(4));
node(...cubeCoords(5));
node(...cubeCoords(6));
node(...cubeCoords(7));

plane([...cubeCoords(0), ...cubeCoords(1), ...cubeCoords(2), ...cubeCoords(3)]);
plane([...cubeCoords(7), ...cubeCoords(6), ...cubeCoords(5), ...cubeCoords(4)]);
plane([...cubeCoords(4), ...cubeCoords(5), ...cubeCoords(1), ...cubeCoords(0)]);
plane([...cubeCoords(5), ...cubeCoords(6), ...cubeCoords(2), ...cubeCoords(1)]);
plane([...cubeCoords(6), ...cubeCoords(7), ...cubeCoords(3), ...cubeCoords(2)]);
plane([...cubeCoords(7), ...cubeCoords(4), ...cubeCoords(0), ...cubeCoords(3)]);

const cube = meshClose(0, 0, 0);
cube.position.x = -1.5;
group.add(cube);

// octahedron

meshOpen();

const h = Math.sqrt(2) / 2;
const octahedronVertices = [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, .5, h, .5, .5, -h, .5].map((v, i) => (i % 3 ===
    1) ?
  v : v - .5);

function octahedronCoords(i) {
  const x = octahedronVertices[i * 3];
  const y = octahedronVertices[i * 3 + 1];
  const z = octahedronVertices[i * 3 + 2];
  return [x, y, z];
}

cylinder(...octahedronCoords(0), ...octahedronCoords(1));
cylinder(...octahedronCoords(1), ...octahedronCoords(2));
cylinder(...octahedronCoords(2), ...octahedronCoords(3));
cylinder(...octahedronCoords(3), ...octahedronCoords(0));

cylinder(...octahedronCoords(0), ...octahedronCoords(4));
cylinder(...octahedronCoords(1), ...octahedronCoords(4));
cylinder(...octahedronCoords(2), ...octahedronCoords(4));
cylinder(...octahedronCoords(3), ...octahedronCoords(4));

cylinder(...octahedronCoords(0), ...octahedronCoords(5));
cylinder(...octahedronCoords(1), ...octahedronCoords(5));
cylinder(...octahedronCoords(2), ...octahedronCoords(5));
cylinder(...octahedronCoords(3), ...octahedronCoords(5));

node(...octahedronCoords(0));
node(...octahedronCoords(1));
node(...octahedronCoords(2));
node(...octahedronCoords(3));
node(...octahedronCoords(4));
node(...octahedronCoords(5));

plane([...octahedronCoords(4), ...octahedronCoords(1), ...octahedronCoords(0)]);
plane([...octahedronCoords(4), ...octahedronCoords(2), ...octahedronCoords(1)]);
plane([...octahedronCoords(4), ...octahedronCoords(3), ...octahedronCoords(2)]);
plane([...octahedronCoords(4), ...octahedronCoords(0), ...octahedronCoords(3)]);
plane([...octahedronCoords(0), ...octahedronCoords(1), ...octahedronCoords(5)]);
plane([...octahedronCoords(1), ...octahedronCoords(2), ...octahedronCoords(5)]);
plane([...octahedronCoords(2), ...octahedronCoords(3), ...octahedronCoords(5)]);
plane([...octahedronCoords(3), ...octahedronCoords(0), ...octahedronCoords(5)]);

const octahedron = meshClose(0, 0, 0);
octahedron.position.z = 1.5;
group.add(octahedron);

// icosahedron

// (0, ±1, ±φ)
// (±1, ±φ, 0)
// (±φ, 0, ±1)

meshOpen();

const theta = (1 + Math.sqrt(5)) / 2;

const icosahedronVertices = [
  -1, theta, 0, 1, theta, 0, -1, -theta, 0, 1, -theta, 0,
  0, -1, theta, 0, 1, theta, 0, -1, -theta, 0, 1, -theta,
  theta, 0, -1, theta, 0, 1, -theta, 0, -1, -theta, 0, 1
].map((n) => n *= .35);

for (let i = 0; i < icosahedronVertices.length; i += 3) {
  node(icosahedronVertices[i], icosahedronVertices[i + 1], icosahedronVertices[i + 2]);
}

const indices = [
  0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
  1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
  3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
  4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1
];

function icosahedronCoords(i) {
  const x = icosahedronVertices[indices[i] * 3];
  const y = icosahedronVertices[indices[i] * 3 + 1];
  const z = icosahedronVertices[indices[i] * 3 + 2];
  return [x, y, z];
}

const edges = new Map();

function edge(a, b) {
  const u = indices[a];
  const v = indices[b];
  let key = (u < v) ? `${u}%${v}` : `${v}%${u}`;
  if (!edges.has(key)) {
    const [x1, y1, z1] = icosahedronCoords(a);
    const [x2, y2, z2] = icosahedronCoords(b);
    cylinder(x1, y1, z1, x2, y2, z2);
    edges.set(key, true);
  }
}

for (let i = 0; i < indices.length; i += 3) {
  const [x1, y1, z1] = icosahedronCoords(i);
  const [x2, y2, z2] = icosahedronCoords(i + 1);
  const [x3, y3, z3] = icosahedronCoords(i + 2);

  edge(i, i + 1);
  edge(i + 1, i + 2);
  edge(i, i + 2);

  plane([x1, y1, z1, x2, y2, z2, x3, y3, z3]);
}

const icosahedron = meshClose(0, 0, 0);
icosahedron.position.z = -1.5;
group.add(icosahedron);

// dodecahedron

function generateDodecahedron() {
  const r = 0.5;

  const phi = (1 + Math.sqrt(5)) / 2;
  const a = 0.5;
  const b = 0.5 * 1 / phi;
  const c = 0.5 * (2 - phi);

  const vertices = [
    c, 0, a,
    -c, 0, a,
    -b, b, b,
    0, a, c,
    b, b, b,
    b, -b, b,
    0, -a, c,
    -b, -b, b,
    c, 0, -a,
    -c, 0, -a,
    -b, -b, -b,
    0, -a, -c,
    b, -b, -b,
    b, b, -b,
    0, a, -c,
    -b, b, -b,
    a, c, 0,
    -a, c, 0,
    -a, -c, 0,
    a, -c, 0
  ];

  function coords(i) {
    const x = vertices[i * 3];
    const y = vertices[i * 3 + 1];
    const z = vertices[i * 3 + 2];
    return [x, y, z];
  }

  //vertices = vertices.map(function(v) { return v.normalize().scale(r); })

  const faces = [
    [4, 3, 2, 1, 0],
    [7, 6, 5, 0, 1],
    [12, 11, 10, 9, 8],
    [15, 14, 13, 8, 9],
    [14, 3, 4, 16, 13],
    [3, 14, 15, 17, 2],
    [11, 6, 7, 18, 10],
    [6, 11, 12, 19, 5],
    [4, 0, 5, 19, 16],
    [12, 8, 13, 16, 19],
    [15, 9, 10, 18, 17],
    [7, 1, 2, 17, 18]
  ];

  const edges = [
    [0, 1],
    [0, 4],
    [0, 5],
    [1, 2],
    [1, 7],
    [2, 3],
    [2, 17],
    [3, 4],
    [3, 14],
    [4, 16],
    [5, 6],
    [5, 19],
    [6, 7],
    [6, 11],
    [7, 18],
    [8, 9],
    [8, 12],
    [8, 13],
    [9, 10],
    [9, 15],
    [10, 11],
    [10, 18],
    [11, 12],
    [12, 19],
    [13, 14],
    [13, 16],
    [14, 15],
    [15, 17],
    [16, 19],
    [17, 18]
  ];

  meshOpen();

  for (let i = 0; i < vertices.length; i += 3) {
    node(vertices[i], vertices[i + 1], vertices[i + 2]);
  }

  for (const edge of edges) {
    cylinder(...coords(edge[0]), ...coords(edge[1]));
  }

  for (const face of faces) {
    const v = [...face.map(i => coords(i))];
    plane(v.flat());
  }

  return meshClose(0, 0, 0);
}

const dodecahedron = generateDodecahedron();
group.add(dodecahedron);

group.scale.setScalar(1);

scene.add(group);

const loopDuration = 5;

cube.castShadow = cube.receiveShadow =
  icosahedron.castShadow = icosahedron.receiveShadow =
  tetrahedron.castShadow = tetrahedron.receiveShadow =
  dodecahedron.castShadow = dodecahedron.receiveShadow =
  octahedron.castShadow = octahedron.receiveShadow = true;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  const o = 1 / 5;

  function ease(t) {
    t = Maf.mod(t, 1);
    if (t < .5) {
      return easings.InOutQuint(t / .5);
    } else {
      return 1 - easings.OutBounce((t - .5) / .5);
    }
  }

  cube.position.y = ease(t * 5);
  icosahedron.position.y = ease(t * 5 + o);
  tetrahedron.position.y = ease(t * 5 + 2 * o);
  octahedron.position.y = ease(t * 5 + 3 * o);
  dodecahedron.position.y = ease(t * 5 + 4 * o);

  function easeRotation(t, num) {
    t = Maf.mod(t, 1);
    return easings.InOutQuint(t) * Math.PI * num;
  }
  cube.rotation.x = easeRotation(t * 5, .5);
  icosahedron.rotation.x = easeRotation(t * 5 + o, 1);
  tetrahedron.rotation.x = easeRotation(t * 5 + 2 * o, 2);
  octahedron.rotation.x = easeRotation(t * 5 + 3 * o, 1);
  dodecahedron.rotation.x = easeRotation(t * 5 + 4 * o, 1);

  group.rotation.y = t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas, renderer, camera };