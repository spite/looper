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
import { Curves } from '../third_party/THREE.CurveExtras.js';

const painted = Painted(renderer, { minLevel: -.3, maxLevel: .9, lightenPass: 0 });

palette.range = ["#D11B0C", "#DA5723", "#180705", "#ffffff", "#C65F35", "#62190D", "#E59359", "#b70000"];
const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(-0.38997204674241887, -0.1646326072361011, 0.3548472598819808);
camera.lookAt(group.position);
renderer.setClearColor(0x314356, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/stroke.png');
strokeTexture.wrapS = strokeTexture.wrapT = THREE.RepeatWrapping;
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const N = 200;

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
const func = seedFunc(-48.38074889028179, 99.9838903394199, -33.14221124326889, 53.3244235587527, 29.328732597272335,
  73.38063084981314);

const curve = new THREE.Curves.CinquefoilKnot();

const up = new THREE.Vector3(0, 1, 0);
const LINES = 100;
const meshes = [];
for (let j = 0; j < LINES; j++) {
  const mesh = prepareMesh(.01 * Maf.randomInRange(.01, 1), Maf.randomInRange(0, 1));
  group.add(mesh);
  const offset = Maf.randomInRange(-1, 0);
  const vertices = new Float32Array(N * 3);
  const r = .5;
  let p = new THREE.Vector3(Maf.randomInRange(-r, r), Maf.randomInRange(-r, r), Maf.randomInRange(-r, r));
  let a1 = Maf.randomInRange(0, Maf.TAU);
  let a2Base = j * Maf.TAU / LINES;
  let a2 = a2Base;
  const mat = new THREE.Matrix4();
  const r1 = .02;
  const r2 = .01 + .08 * j / LINES;
  const e = .001;
  const tmp = p.clone();
  for (let i = -1; i < N; i++) {
    const p = curve.getPoint(a1);
    const p2 = curve.getPoint(a1 + e);
    const d = new THREE.Vector3(r2 * Math.cos(a2), r2 * Math.sin(a2), 0);
    mat.lookAt(p, p2, up);
    d.applyMatrix4(mat);
    p.multiplyScalar(.9 * r1 + 0. * .2 * r1 * j / LINES).add(d);
    if (i >= 0) {
      vertices[i * 3] = p.x;
      vertices[i * 3 + 1] = p.y;
      vertices[i * 3 + 2] = p.z;
    }
    p.set(a1, a2, .1).multiplyScalar(.1);
    const res = curl(p, func);
    const da = Math.atan(res.y, res.x);
    a2 = a2Base + ((i + 1) / (N + 1)) * 4 * Maf.TAU;
    a1 += .05 * da / Maf.TAU;
    a1 = Maf.mod(a1, 1);
  }
  mesh.material.uniforms.dashArray.value.set(1, Maf.randomInRange(0, 2));
  mesh.material.uniforms.repeat.value.x = Math.round(Maf.randomInRange(4, 8));
  mesh.g.setGeometry(vertices);
  mesh.scale.setScalar(5);
  const speed = 2 * Math.round(Maf.randomInRange(1, 3));
  meshes.push({ mesh, offset, speed });
}
group.scale.setScalar(.045);
scene.add(group);

const loopDuration = 4;
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