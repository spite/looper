import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { TubeBufferGeometry } from '../modules/three-tube-geometry.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: .1 });

palette.range = ["#FFFFFF", "#FE2F04", "#0D5B93", "#0E4366", "#C74619", "#F5B067", "#F5C893"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(3, 3);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const N = 400;
const mat = new THREE.MeshStandardMaterial({ color: palette.range[2], metalness: .5, roughness: .4 });
const mat2 = new THREE.MeshStandardMaterial({ color: palette.range[4], metalness: .5, roughness: .4 });
const r = 2;

group.scale.setScalar(.75);

scene.add(group);

const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
directionalLight.position.set(-2, 2, 2);
directionalLight.castShadow = true;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(palette.range[0], palette.range[1], .5);
scene.add(light);

camera.position.set(0, -6, 6);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.rotation.z = -Maf.PI / 4;
renderer.setClearColor(palette.range[5], 1);
scene.fog = new THREE.FogExp2(palette.range[5], 0.12);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;
const cameraOffset = new THREE.Vector3();

const d = 2;
const q = 1;
const vertices = [];
for (let i = 0; i < N; i++) {
  const tw = 2 * Math.PI * q;
  const th = i * Maf.TAU / N;

  const ph = Math.cos(th) * tw;
  const y = r * Math.cos(th);
  const x = r * Math.sin(th) * Math.cos(ph);
  const z = r * Math.sin(th) * Math.sin(ph);

  vertices.push(new THREE.Vector3(x, y, z));
}

vertices.push(vertices[0].clone());

const cylinderRadius = .1;
var path = new THREE.CatmullRomCurve3(vertices);
var geometry = new TubeBufferGeometry(path, vertices.length, cylinderRadius, 18, !true);

const mesh = new THREE.Mesh(geometry, mat);
mesh.castShadow = mesh.receiveShadow = true;
group.add(mesh);

const mesh2 = new THREE.Mesh(geometry, mat2);
mesh2.castShadow = mesh2.receiveShadow = true;
mesh2.rotation.y = Maf.PI / 2;
group.add(mesh2)

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  mesh.scale.setScalar(1 + .25 * Math.sin(t * Maf.TAU));
  mesh.rotation.y = t * Maf.TAU;

  group.rotation.x = t * Maf.TAU - Maf.PI / 2 - Maf.PI / 4;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };