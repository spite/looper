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

palette.range = ["#D64672", "#B81533", "#EB8755", "#0E060B", "#C3D5D6", "#6D0714", "#6D839D", "#D44139"];

const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;

camera.position.set(0, 0, 27);
camera.lookAt(group.position);
renderer.setClearColor(palette.range[4], 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const circleRadius = 2;
const geometry = new THREE.Geometry();
for (let j = 0; j <= Maf.TAU / 3; j += Math.PI / 72) {
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
  const lineWidth = Maf.map(0, SIDES, .5, 1, i);
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
  line.setGeometry(geometry);
  const mesh = new THREE.Mesh(line.geometry, material);
  const pivot = new THREE.Group();
  const a = i * Maf.TAU / 3 + i * Maf.TAU / SIDES;
  mesh.position.z = .1 * Math.exp(1 + .03 * i);
  pivot.add(mesh);
  group.add(pivot);
  mesh.scale.setScalar(.1 + 3 * (i / SIDES));
  circles.push({ lineWidth, mesh, pivot, c: Maf.randomInRange(0, 1), a });
}
scene.add(group);

const loopDuration = 3.5;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  circles.forEach((c, id) => {
    c.mesh.rotation.z = -t * Maf.TAU + c.a;
    c.mesh.material.uniforms.color.value.copy(gradient.getAt(c.c));
    c.mesh.material.uniforms.lineWidth.value = c.lineWidth * easings.InOutQuint(.5 + .5 * Math.sin((t + .5 * id / circles.length) * Maf.TAU + 0 * c.a));
  });

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };