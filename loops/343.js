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

const painted = Painted(renderer, { minLevel: -.1, maxLevel: 1., lightenPass: 0 });

palette.range = ["#FE2A1E", "#FE6E52", "#FE8666", "#2039DE", "#548082", "#BD324B", "#F7B625"];
const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(-0.33004851536051316, 0.40697480706900474, 0.17475169347118147);
camera.lookAt(group.position);
renderer.setClearColor(0xfdd0c9, 1);

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
const LINES = 200;
const meshes = [];
const m = new THREE.Matrix4();
for (let j = 0; j < LINES; j++) {
  const mesh = prepareMesh(.01 * Maf.randomInRange(.01, 1), Maf.randomInRange(0, 1));
  group.add(mesh);
  const offset = Maf.randomInRange(-1, 0);
  const vertices = new Float32Array(N * 3);
  const r = .5;
  let p = new THREE.Vector3(Maf.randomInRange(-r, r), 0, Maf.randomInRange(-r, r));
  const tmp = p.clone();
  for (let i = 0; i < N; i++) {
    m.makeRotationY(2 * i / N);
    const res = curl(tmp.multiplyScalar(2 * (1 + .5 * j / LINES)), func);
    res.multiplyScalar(.01);
    p.x += res.x;
    p.z += res.z;
    p.y += .01 * Math.abs(res.y) + .001;
    tmp.copy(p);
    tmp.applyMatrix4(m);
    vertices[i * 3] = p.x;
    vertices[i * 3 + 1] = p.y;
    vertices[i * 3 + 2] = p.z;
  }
  mesh.material.uniforms.dashArray.value.set(1, Math.round(Maf.randomInRange(1, 2)));
  mesh.material.uniforms.repeat.value.x = Math.round(Maf.randomInRange(8, 12));
  mesh.g.setGeometry(vertices);
  mesh.scale.setScalar(
    5);
  const speed = 4 * Math.round(Maf.randomInRange(1, 3));
  meshes.push({ mesh, offset, speed });
}
group.scale.setScalar(.08);
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