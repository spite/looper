import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.5 });

palette.range = ["#F48555", "#D9210F", "#5A0F04", "#FFFFFF", "#BC825F", "#F1B298"];

const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);

camera.position.set(-2.3, 26, 26);
camera.lookAt(group.position);
renderer.setClearColor(0xF2E9D9, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.sortObjects = false;

const N = 18;
const circleRadius = 2;
const geo = new Float32Array(N * 3);

const resolution = new THREE.Vector2(canvas.width, canvas.height);
const strokeTexture = new THREE.TextureLoader().load('./assets/PaintBrushStroke05.png');

const circles = [];
const SIDES = 2 * 72;
for (let i = 0; i < SIDES; i++) {
  const lineWidth = 1 + .025 * i;
  const material = new MeshLineMaterial({
    map: strokeTexture,
    useMap: true,
    color: new THREE.Color().setHSL(i / SIDES, 1, .5),
    resolution: resolution,
    sizeAttenuation: true,
    lineWidth,
    near: camera.near,
    far: camera.far,
    depthWrite: false,
    depthTest: false,
    transparent: true,
    opacity: .75,
    alphaTest: .75 * .5,
  });
  var g = new MeshLine();
  g.setGeometry(geo);
  const mesh = new THREE.Mesh(g.geometry, material);
  mesh.geo = geo;
  mesh.g = g;
  const pivot = new THREE.Group();
  const a = Maf.randomInRange(0, Maf.TAU);
  const x = 3 * Math.sin(a);
  const y = i;
  const z = 3 * Math.cos(a);
  pivot.position.set(0, y, 0);
  mesh.rotation.x = Math.PI / 2;
  pivot.add(mesh);
  group.add(pivot);
  mesh.scale.setScalar(1 + .025 * i);
  circles.push({ lineWidth, mesh, pivot, x, y, c: Maf.randomInRange(0, 1), z, a });
}
scene.add(group);

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  const H = 8;
  circles.forEach((c, id) => {
    c.pivot.rotation.y = t * Maf.TAU + c.a;
    c.mesh.material.uniforms.color.value.copy(gradient.getAt(c.c));
    const v = c.lineWidth;
    c.pivot.position.y = Maf.mod(c.y + H * t, H);
    const s = Maf.parabola(c.pivot.position.y / H, 2);
    c.pivot.position.y = -H + 2 * Maf.mod(c.y + H * t, H);
    const step = Math.PI / 18;
    const vertices = c.mesh.geo;
    const l = vertices.length;
    for (let j = 0; j < l; j++) {
      const a = -Maf.map(0, l, 0, .5 * Maf.TAU * s, j);
      vertices[j * 3] = circleRadius * Math.cos(a);
      vertices[j * 3 + 1] = circleRadius * Math.sin(a);
      vertices[j * 3 + 2] = -j / (10 * H);
    }
    c.mesh.material.uniforms.opacity.value = .75 * easings.InOutQuad(s) ** 2;
    c.mesh.material.uniforms.alphaTest.value = c.mesh.material.uniforms.opacity.value * .5;
    c.mesh.g.setGeometry(vertices);
  });

  painted.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };