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
import pointsOnSphere from '../modules/points-sphere.js';

const painted = Painted(renderer, { minLevel: -.4, maxLevel: 1., lightenPass: 0 });

palette.range = ["#ECECEC", "#A8A7A7", "#AC050A", "#0E0E0C", "#F38606", "#3D583F", "#0966C4", "#C54A35"];
const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(-0.38997204674241887, -0.1646326072361011, 0.3548472598819808);
camera.lookAt(group.position);
renderer.setClearColor(0xefefef, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/stroke.png');
strokeTexture.wrapS = strokeTexture.wrapT = THREE.RepeatWrapping;
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const N = 1000;

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
//const func = seedFunc(-53.82730791212893,45.48216468394176,44.866734022764945,-33.39552077431472,95.75097771694763,-1.7435116651043785);
const func = seedFunc(47.979861439134766, -34.913145817269694, 81.50811255372966, -2.101307517999061, 97.40091354760204,
  -34.50353572024456);

const up = new THREE.Vector3(0, 1, 0);
const LINES = 200;
const points = pointsOnSphere(LINES);
const meshes = [];
for (let j = 0; j < LINES; j++) {
  const mesh = prepareMesh(.0125 * Maf.randomInRange(.01, 1), Maf.randomInRange(0, 1));
  group.add(mesh);
  const offset = Maf.randomInRange(-1, 0);
  const vertices = new Float32Array(N * 3);
  const r = .5;
  let p = new THREE.Vector3(Maf.randomInRange(-r, r), Maf.randomInRange(-r, r), Maf.randomInRange(-r, r));
  p.copy(points[j]).multiplyScalar(r);
  p.x += Maf.randomInRange(-.01, .01);
  p.y += Maf.randomInRange(-.01, .01);
  p.z += Maf.randomInRange(-.01, .01);
  const tmp = p.clone();
  for (let i = 0; i < N; i++) {
    const res = curl(tmp.multiplyScalar(.75 + .4 * j / LINES), func);
    res.multiplyScalar(.02 + .006 * j / LINES);
    p.add(res);
    p.normalize().multiplyScalar(.5 + .1 * j / LINES);
    tmp.copy(p);
    p.multiplyScalar(1 - .75 * j / LINES);
    vertices[i * 3] = p.x;
    vertices[i * 3 + 1] = p.y;
    vertices[i * 3 + 2] = p.z;
  }
  mesh.material.uniforms.dashArray.value.set(1, 1);
  mesh.material.uniforms.repeat.value.x = 40;
  mesh.g.setGeometry(vertices);
  mesh.scale.setScalar(5);
  const speed = 2 * Math.round(Maf.randomInRange(1, 3));
  meshes.push({ mesh, offset, speed });
}
group.scale.setScalar(.06);
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