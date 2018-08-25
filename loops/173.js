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

palette.range = ["#F6D199", "#EDA65D", "#5B3B16", "#1F1408", "#AF551E", "#FEFBF5", "#546A5B"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(3, 3);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

const N = 400;
const mat = new THREE.MeshStandardMaterial({ color: 0xb70000, metalness: .1, roughness: .4 });
const r = 2;

const sphere = new THREE.Mesh(
  new THREE.IcosahedronBufferGeometry(1.5, 4),
  new THREE.MeshStandardMaterial({ metalness: 0, roughness: .2, color: 0xb7b7b7, transparent: !true, opacity: .2 })
);
sphere.receiveShadow = true;
scene.add(sphere);

group.scale.setScalar(1);

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
renderer.setClearColor(palette.range[0], 1);
scene.fog = new THREE.FogExp2(palette.range[0], 0.11);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  while (group.children.length) {
    let m = group.children[0];
    group.remove(m);
    m.geometry.dispose();
    m = null;
  }

  const q = easings.InOutQuad(.5 + .5 * Math.cos(Maf.PI + t * Maf.TAU));
  const vertices = [];
  for (let i = 0; i < N; i++) {
    const tw = 2.5 * Math.PI * q;
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

  group.rotation.x = t * Maf.PI + Maf.PI / 4;
  group.rotation.z = t * Maf.PI - Maf.PI / 4;
  group.rotation.y = Maf.PI;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };