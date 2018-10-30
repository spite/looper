import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.4 });

palette.range = ["#CC1917", "#1E0F10", "#55190C", "#37454B", "#C9642D", "#F69249", "#7B8E9B"];

const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);

camera.position.set(5.8, 5.2, -21);
camera.lookAt(group.position);
renderer.setClearColor(0, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/brush4.png');
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const meshes = [];

function prepareMesh(points, w, c) {

  var geo = new Float32Array(points * 3);
  for (var j = 0; j < geo.length; j += 3) {
    geo[j] = geo[j + 1] = geo[j + 2] = 0;
  }

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
    alphaTest: .75 * .5,
    depthWrite: true,
    depthTest: true,
    transparent: true,
    opacity: .75,
  });

  var mesh = new THREE.Mesh(g.geometry, material);
  mesh.geo = geo;
  mesh.g = g;

  return mesh;
}

const LINES = 10;

for (let i = 0; i < LINES; i++) {
  const w = Maf.randomInRange(.1, 2);
  const radius = 7;
  const radius2 = Maf.randomInRange(1, 5);
  const color = Maf.randomInRange(0, 1);
  const offset = Maf.randomInRange(0, .25 * Maf.TAU);
  const range = Maf.randomInRange(.2, .4);
  const points = 4 * Math.round(Maf.TAU * radius);
  const mesh = prepareMesh(points, w, color);
  group.add(mesh);
  meshes.push({
    mesh,
    radius,
    radius2,
    offset,
    range,
    factor: 1, //Maf.randomInRange(.25, 1)
  });
  mesh.g.setGeometry(mesh.geo);
}
group.scale.setScalar(.5);
scene.add(group);

const loopDuration = 4;
const tmpVector = new THREE.Vector3();
const tmpMat = new THREE.Matrix4();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach((m, i) => {
    const geo = m.mesh.geo;
    const points = geo.length / 3;
    for (let i = 0, ptr = 0; i < points; i++) {
      const a = m.factor * m.range * i * Maf.TAU / points + t * Maf.TAU + m.offset;
      const f = .85;
      const x = Math.pow(Math.abs(Math.cos(a)), f) * m.radius * Math.sign(Math.cos(a));
      const z = Math.pow(Math.abs(Math.sin(a)), f) * m.radius * Math.sign(Math.sin(a));
      const y = 0;
      const b = i * Maf.TAU / points + 4 * t * Maf.TAU;
      const r = m.radius2;
      tmpVector.set(
        Math.pow(Math.abs(Math.cos(b)), f) * r * Math.sign(Math.cos(b)),
        Math.pow(Math.abs(Math.sin(b)), f) * r * Math.sign(Math.sin(b)),
        0);
      tmpMat.makeRotationY(-a);
      tmpVector.applyMatrix4(tmpMat);
      geo[ptr + 0] = x + tmpVector.x;
      geo[ptr + 1] = y + tmpVector.y;
      geo[ptr + 2] = z + tmpVector.z;
      ptr += 3;
    }
    m.mesh.g.setGeometry(geo);
  });
  group.rotation.x = t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };