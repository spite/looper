import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import easings from '../modules/easings.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import Painted from '../modules/painted.js';
import { curl, generateNoiseFunction, seedFunc } from '../modules/curl.js';

const painted = Painted(renderer, { minLevel: -.4, maxLevel: 1., lightenPass: 0 });

palette.range = ["#060607", "#2E354B", "#F52300", "#512822", "#515463", "#F74C02", "#8A90A1", "#9F2D0C"];
const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(-.75, 0, 0);
camera.lookAt(group.position);
renderer.setClearColor(0xffc984, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/stroke.png');
strokeTexture.wrapS = strokeTexture.wrapT = THREE.RepeatWrapping;
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const N = 500;

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
    repeat: new THREE.Vector2(1, 1),
    alphaTest: .75 * .5,
    depthWrite: true,
    depthTest: true,
    transparent: true,
    opacity: 1,
    dashArray: new THREE.Vector2(1, 0),
    dashOffset: 0,
  });

  var mesh = new THREE.Mesh(g.geometry, material);
  mesh.geo = geo;
  mesh.g = g;

  return mesh;
}

//const func = generateNoiseFunction();
const func = seedFunc(66.20243698564775, 69.0225914220843, 0.601423916465734, 28.44243021261002, -89.41275690441333,
  24.71859960593177);

const up = new THREE.Vector3(0, 1, 0);
const center = new THREE.Vector3(0, 0, 0);
const LINES = 400;
const meshes = [];
const m = new THREE.Matrix4();
for (let j = 0; j < LINES; j++) {
  const mesh = prepareMesh(.01 * Maf.randomInRange(.01, 1), Maf.randomInRange(0, 1));
  group.add(mesh);
  const offset = Maf.randomInRange(-1, 0);
  const vertices = new Float32Array(N * 3);
  const r = .5;
  let p = new THREE.Vector3(Maf.randomInRange(-r, r), 0, Maf.randomInRange(-r, r));
  p.normalize();
  p.y = Maf.randomInRange(-.5, .5);
  const tmp = p.clone();
  for (let i = 0; i < N; i++) {
    const res = curl(p.multiplyScalar(1), func);
    res.multiplyScalar(.0075);
    p.add(res);
    let y = p.y;
    p.y = 0;
    p.normalize().multiplyScalar(.5 - .25 * i / N);
    p.y = Maf.clamp(y, -.5, .5);
    tmp.copy(p);
    tmp.multiplyScalar(1);
    vertices[i * 3] = tmp.x;
    vertices[i * 3 + 1] = tmp.y;
    vertices[i * 3 + 2] = tmp.z;
  }
  mesh.material.uniforms.dashArray.value.set(1, Math.round(Maf.randomInRange(1, 2)));
  mesh.material.uniforms.repeat.value.x = Math.round(Maf.randomInRange(2, 8));
  mesh.g.setGeometry(vertices);
  mesh.scale.setScalar(
    5);
  const speed = 4 * Math.round(Maf.randomInRange(1, 3));
  meshes.push({ mesh, offset, speed });
}
group.scale.setScalar(.05);
scene.add(group);

const loopDuration = 5;
const r = 2;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach((m) => {
    const tt = Maf.mod(m.speed * t, 1);
    m.mesh.material.uniforms.dashOffset.value = -(tt + m.offset);
  });

  group.rotation.y = t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas, renderer, camera };