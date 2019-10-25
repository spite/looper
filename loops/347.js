import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import easings from '../modules/easings.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import Painted from '../modules/painted.js';
import { AizawaAttractor } from '../modules/aizawa-attractor.js';

const painted = Painted(renderer, { minLevel: -.4, maxLevel: 1., lightenPass: 0 });

palette.range = ["#0E4729", "#E99410", "#DD6514", "#C60C10", "#A91D09", "#342119", "#DDC3B0", "#B68E5E"];
const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(-.75, -.5, 0);
camera.lookAt(group.position);
renderer.setClearColor(0xf6cf44, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/brush4.png');
strokeTexture.wrapS = strokeTexture.wrapT = THREE.RepeatWrapping;
const strokeTexture2 = new THREE.TextureLoader().load('./assets/brush2.png');
strokeTexture2.wrapS = strokeTexture2.wrapT = THREE.RepeatWrapping;
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const N = 3000;

const geo = new Float32Array(N * 3);
const radius = 2;
const lineWidth = 1;

function prepareMesh(w, c) {

  var g = new MeshLine();
  g.setGeometry(geo, function(p) { return p; });

  const material = new MeshLineMaterial({
    map: Math.random() > .5 ? strokeTexture : strokeTexture2,
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

const attractor = new AizawaAttractor();
//attractor.randomize();
//console.log(attractor.alpha, attractor.gamma, attractor.x, attractor.y, attractor.z);

const up = new THREE.Vector3(0, 1, 0);
const center = new THREE.Vector3(0, 0, 0);
const LINES = 100;
const meshes = [];
const m = new THREE.Matrix4();
for (let j = 0; j < LINES; j++) {
  const mesh = prepareMesh(.02 * Maf.randomInRange(.01, 2), Maf.randomInRange(0, 1));
  group.add(mesh);
  const offset = Maf.randomInRange(-1, 0);
  const vertices = new Float32Array(N * 3);
  const r = .01 + .02 * j / LINES;
  var p = {
    x: attractor.x + Maf.randomInRange(-r, r),
    y: attractor.y + Maf.randomInRange(-r, r),
    z: attractor.z + Maf.randomInRange(-r, r)
  }
  const scale = .025;
  for (let i = 0; i < N; i++) {
    p = attractor.generatePoint(p.x, p.y, p.z);
    vertices[i * 3] = scale * p.x;
    vertices[i * 3 + 1] = scale * p.y;
    vertices[i * 3 + 2] = scale * p.z;
  }
  const l = Math.round(Maf.randomInRange(1, 20));
  mesh.material.uniforms.dashArray.value.set(1, l);
  mesh.material.uniforms.repeat.value.x = Math.round(Maf.randomInRange(1, l));
  mesh.g.setGeometry(vertices);
  mesh.scale.setScalar(
    5);
  const speed = 1 + Math.round(.05 * Maf.randomInRange(0, 20 - l));
  meshes.push({ mesh, offset, speed });
  mesh.position.z = -.1;
}
group.scale.setScalar(1);
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
  //  group.rotation.x = Math.sin(t * Maf.TAU) * Maf.TAU / 32;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas, renderer, camera };