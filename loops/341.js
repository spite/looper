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
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';

const painted = Painted(renderer, { minLevel: -.1, maxLevel: 1., lightenPass: 0 });

palette.range = ["#FE695A", "#0F2246", "#CE451C", "#FEF2CD", "#EEC1A6", "#57424A", "#E2902D"];
const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(-0.38997204674241887, -0.1646326072361011, 0.3548472598819808);
camera.lookAt(group.position);
renderer.setClearColor(0xffe8b8, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/brush4.png');
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
const func = seedFunc(67.14916212144274, -66.58264922976667, 26.30802081903076, -49.46527967481953, -80.13398717797276,
  -59.007133755175765);

const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3());
const cube = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, .1, 5), new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }));

const up = new THREE.Vector3(0, 1, 0);
const center = new THREE.Vector3(0, 0, 0);
const LINES = 300;
const meshes = [];
for (let j = 0; j < LINES; j++) {
  const mesh = prepareMesh(.02 * Maf.randomInRange(.01, 1), Maf.randomInRange(0, 1));
  group.add(mesh);
  const offset = Maf.randomInRange(-1, 0);
  const vertices = new Float32Array(N * 3);
  const r = .1;
  let p = new THREE.Vector3(Maf.randomInRange(-r, r), Maf.randomInRange(-r, r), Maf.randomInRange(-r, r));
  const tmp = p.clone();
  for (let i = 0; i < N; i++) {
    const res = curl(tmp.multiplyScalar(1 + .5 * j / LINES), func);
    res.multiplyScalar(.02);
    p.add(res);
    raycaster.ray.origin.copy(center);
    raycaster.ray.direction.copy(p).normalize();
    const intersects = raycaster.intersectObject(cube);
    p.copy(intersects[0].point).multiplyScalar(.5 - .1 * j / LINES);
    tmp.copy(p);
    vertices[i * 3] = p.x;
    vertices[i * 3 + 1] = p.y;
    vertices[i * 3 + 2] = p.z;
  }
  mesh.material.uniforms.dashArray.value.set(1, Math.round(Maf.randomInRange(1, 2)));
  mesh.material.uniforms.repeat.value.x = 1 * Math.round(Maf.randomInRange(1, 3));
  mesh.g.setGeometry(vertices);
  mesh.scale.setScalar(
    5);
  const speed = 1 * Math.round(Maf.randomInRange(1, 3));
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