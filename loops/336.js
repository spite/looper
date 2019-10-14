import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import easings from '../modules/easings.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import Painted from '../modules/painted.js';
import { curl, generateNoiseFunction } from '../modules/curl.js';
import pointsOnSphere from '../modules/points-sphere.js';

const painted = Painted(renderer, { minLevel: -.2, maxLevel: 1. });

palette.range = ["#DD5E0F", "#2B1BA8", "#F02620", "#E98965", "#F65C48", "#24134D", "#FDD2D4"];
const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(-0.38997204674241887, -0.1646326072361011, 0.3548472598819808);
camera.lookAt(group.position);
renderer.setClearColor(0xf9b540, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/brush2.png');
strokeTexture.wrapS = strokeTexture.wrapT = THREE.RepeatWrapping;
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const N = 100;

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
    dashArray: new THREE.Vector2(1, 3),
    dashOffset: 0,
  });

  var mesh = new THREE.Mesh(g.geometry, material);
  mesh.geo = geo;
  mesh.g = g;

  return mesh;
}

const up = new THREE.Vector3(0, 1, 0);
const LINES = 200;
const points = pointsOnSphere(LINES);
const meshes = [];
for (let j = 0; j < LINES; j++) {
  const mesh = prepareMesh(.05 * Maf.randomInRange(.01, .5), Maf.randomInRange(0, 1));
  group.add(mesh);
  const offset = Maf.randomInRange(-1, 1);
  const vertices = new Float32Array(N * 3);
  const r = .2;
  let p = new THREE.Vector3(Maf.randomInRange(-r, r), Maf.randomInRange(-r, r), Maf.randomInRange(-r, r));
  p.copy(points[j]).multiplyScalar(r);
  const tmp = p.clone();
  for (let i = 0; i < N; i++) {
    const res = curl(tmp.multiplyScalar(1));
    res.multiplyScalar(.02);
    p.add(res);
    tmp.copy(p);
    vertices[i * 3] = p.x;
    vertices[i * 3 + 1] = p.y;
    vertices[i * 3 + 2] = p.z;
  }
  mesh.material.uniforms.dashArray.value.set(1, Maf.randomInRange(0, 1));
  mesh.material.uniforms.repeat.value.x = 1 * Math.round(Maf.randomInRange(3, 6));
  mesh.g.setGeometry(vertices);
  mesh.scale.setScalar(5);
  const speed = 4 * Math.round(Maf.randomInRange(1, 3));
  meshes.push({ mesh, offset, speed });
}
group.scale.setScalar(.06);
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