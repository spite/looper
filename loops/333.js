import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import easings from '../modules/easings.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import Painted from '../modules/painted.js';
import { Curves } from '../third_party/THREE.CurveExtras.js';

const painted = Painted(renderer, { minLevel: -.2, maxLevel: 1.2, lightenPass: 0 });

palette.range = ["#F5CEB4", "#FEE8DD", "#FE9A75", "#261738", "#BAACDB", "#D05A34", "#2D2EA2", "#E69B46"]
const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(35, 15, -35).multiplyScalar(.085);
camera.lookAt(group.position);
group.position.y -= .3;
renderer.setClearColor(0x261738, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/brush2.png');
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const N = 80 * 6;
const curve = new THREE.Curves.KnotCurve();

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
    repeat: new THREE.Vector2(3, 1),
    alphaTest: .75 * .5,
    depthWrite: true,
    depthTest: true,
    transparent: true,
    opacity: 1,
    dashArray: new THREE.Vector2(1, 1),
    dashOffset: 0,
  });

  var mesh = new THREE.Mesh(g.geometry, material);
  mesh.geo = geo;
  mesh.g = g;

  return mesh;
}

const up = new THREE.Vector3(0, 1, 0);
const LINES = 10;
const meshes = [];
for (let j = 0; j < LINES; j++) {
  const mesh = prepareMesh(.1 + .2 * Maf.randomInRange(.1, 2) * j / LINES, Maf.randomInRange(0, 1));
  group.add(mesh);
  const offset = Maf.randomInRange(0, 1);
  const vertices = new Float32Array(N * 3);
  const mat = new THREE.Matrix4();
  const RSEGS = 80;
  const r1 = 2 + .05 * j;
  const r2 = .5 + .1 * j;
  for (let i = 0; i < (N - 1); i++) {
    const segment = i / (N - 1);
    const ringAngle = 1 * i * Maf.TAU / RSEGS;
    const p = curve.getPoint(segment);
    const p2 = curve.getPoint(segment + .001);
    const d = new THREE.Vector3(r2 * Math.cos(ringAngle), r2 * Math.sin(ringAngle), 0);
    mat.lookAt(p, p2, up);
    d.applyMatrix4(mat);
    p.multiplyScalar(.025);
    vertices[i * 3] = p.x + d.x;
    vertices[i * 3 + 1] = p.y + d.y;
    vertices[i * 3 + 2] = p.z + d.z;
  }
  vertices[(N - 1) * 3] = vertices[0];
  vertices[(N - 1) * 3 + 1] = vertices[1]
  vertices[(N - 1) * 3 + 2] = vertices[2];
  mesh.material.uniforms.dashArray.value.set(1, 3); //1 + 1 * j / LINES);
  mesh.material.uniforms.repeat.value.x = 1; // * (3 + j * 3 / LINES);
  mesh.g.setGeometry(vertices);
  mesh.scale.setScalar(5);
  const speed = Math.floor(Maf.randomInRange(1, 4));
  meshes.push({ mesh, offset, speed });
}
group.scale.setScalar(.09);
scene.add(group);

const loopDuration = 4;
const r = 2;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach((m) => {
    const tt = Maf.mod(m.speed * t, 1);
    m.mesh.material.uniforms.dashOffset.value = -1 * tt - m.offset;
  });

  group.rotation.y = t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas, renderer, camera };