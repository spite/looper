import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import easings from '../modules/easings.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.3 });

palette.range = ["#E15626", "#B94720", "#100C18", "#A72417", "#C8371E", "#5D2F25", "#EDC09E"];
const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(35, 15, -35).multiplyScalar(.08);
camera.lookAt(group.position);
renderer.setClearColor(0xf6a16d, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/brush2.png');
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const N = 80 * 6;

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
    repeat: new THREE.Vector2(5, 1),
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

const LINES = 80;
const meshes = [];
for (let j = 0; j < LINES; j++) {
  const mesh = prepareMesh(.1 * Maf.randomInRange(.1, 2), Maf.randomInRange(0, 1));
  group.add(mesh);
  const offset = Maf.randomInRange(0, 1);
  const vertices = new Float32Array(N * 3);
  const mat = new THREE.Matrix4();
  const RSEGS = 80;
  const r1 = 1 + .005 * j;
  const r2 = .5 + .01 * j;
  for (let i = 0; i < (N - 1); i++) {
    const segment = (i / RSEGS);
    const ringAngle = i * Maf.TAU / RSEGS;
    const segAngle = segment * 4 * Maf.TAU / ((N - 1) / RSEGS);
    const p = new THREE.Vector3(r1 * Math.cos(segAngle), 0, r1 * Math.sin(segAngle));
    const d = new THREE.Vector3(r2 * Math.cos(ringAngle), r2 * Math.sin(ringAngle), 0);
    mat.makeRotationY(-segAngle);
    d.applyMatrix4(mat);
    vertices[i * 3] = p.x + d.x;
    vertices[i * 3 + 1] = p.y + d.y;
    vertices[i * 3 + 2] = p.z + d.z;
  }
  vertices[(N - 1) * 3] = vertices[0];
  vertices[(N - 1) * 3 + 1] = vertices[1]
  vertices[(N - 1) * 3 + 2] = vertices[2];
  mesh.material.uniforms.dashArray.value.set(Maf.randomInRange(1, 2), Maf.randomInRange(4, 8));
  mesh.g.setGeometry(vertices);
  mesh.scale.setScalar(5);
  mesh.material.uniforms.repeat.value.x = Math.floor(Maf.randomInRange(3, 5));
  const speed = Math.floor(Maf.randomInRange(1, 2));
  meshes.push({ mesh, offset, speed });
}
group.scale.setScalar(.09);
scene.add(group);

const loopDuration = 3;
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