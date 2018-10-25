import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.4 });

palette.range = ["#FA6014", "#FB9516", "#F72D0D", "#F6BEAA", "#420907", "#FBA767", "#9D1D16", "#FD778C"];

const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);

camera.position.set(7.8, 3.6, 7.3);
camera.lookAt(group.position);
renderer.setClearColor(0xF2E9D9, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const circleRadius = 2;
const geometry = new THREE.Geometry();
for (let j = 0; j <= 1 * Math.PI; j += Math.PI / 72) {
  const v = new THREE.Vector3(circleRadius * Math.cos(j), circleRadius * Math.sin(j), 0);
  geometry.vertices.push(v);
}
geometry.vertices.reverse();

const resolution = new THREE.Vector2(canvas.width, canvas.height);
const strokeTexture = new THREE.TextureLoader().load('./assets/brush4.png');

const circles = [];
const SIDES = 72;
for (let i = 0; i < SIDES; i++) {
  const line = new MeshLine();
  const lineWidth = 1;
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
    opacity: .95,
    alphaTest: .95 * .5,
  });
  line.setGeometry(geometry, function(p) { return p; });
  const mesh = new THREE.Mesh(line.geometry, material);
  const pivot = new THREE.Group();
  const a = Maf.randomInRange(0, Maf.TAU);
  const x = 3 * Math.sin(a);
  const y = .05 * (-.5 * SIDES + i);
  const z = 3 * Math.cos(a);
  pivot.position.set(0, y * 1.1, 0);
  mesh.rotation.x = Math.PI / 2;
  pivot.add(mesh);
  group.add(pivot);
  mesh.scale.setScalar(.1 + Maf.parabola(i / SIDES, .5));
  circles.push({ lineWidth, mesh, pivot, x, c: Maf.randomInRange(0, 1), speed: 1 + Math.round(Maf.randomInRange(0, 2)), z, a });
}
scene.add(group);

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  circles.forEach((c, id) => {
    c.pivot.rotation.y = c.speed * t * Maf.TAU + c.a;
    c.mesh.material.uniforms.color.value.copy(gradient.getAt(c.c));
    c.mesh.material.uniforms.lineWidth.value = c.lineWidth * easings.InOutQuint(.5 + .5 * Math.sin((t + .5 * id / circles.length) * Maf.TAU + .1 * c.a));
  });

  group.rotation.x = Maf.PI / 8;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };