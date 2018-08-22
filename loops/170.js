import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';
import { palette2 as palette } from '../modules/floriandelooij.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: 0 });

palette.range = ["#F6D199", "#EDA65D", "#5B3B16", "#1F1408", "#AF551E", "#FEFBF5", "#546A5B"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(3, 3);
const scene = new THREE.Scene();
const group = new THREE.Group();

const objects = [];

const RINGS = 40;
const OBJECTS = 16;
const l = Maf.TAU / OBJECTS;
const geo = new RoundedFlatTorus(1, 2, 1, .25, 18, 9, 0, l, true);
const mats = palette.range
  .map((c) => new THREE.MeshStandardMaterial({ color: c, metalness: .1, roughness: .5 }));

for (let j = 0; j < RINGS; j++) {
  const pivot = new THREE.Group();
  const a = j * Maf.TAU / RINGS;
  const r = 2;
  const x = r * Math.cos(a);
  const y = r * Math.sin(a);
  pivot.position.set(x, y, 0);
  pivot.rotation.z = a;

  const meshes = [];
  const centers = [];

  for (let k = 0; k < OBJECTS; k++) {
    const mesh = new THREE.Mesh(geo, mats[Math.floor(Math.random() * mats.length)]);
    mesh.castShadow = mesh.receiveShadow = true;
    //mesh.scale.x = Maf.randomInRange(.5, 5);
    mesh.userData.scale = mesh.scale.x;
    mesh.rotation.y = k * Maf.TAU / OBJECTS;
    pivot.add(mesh);
    meshes.push(mesh);
  }

  objects.push({ meshes, pivot });
  group.add(pivot);
}
group.scale.setScalar(.8);
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

camera.position.set(0, 6, 6);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.rotation.z = -3 * Math.PI / 4;
renderer.setClearColor(palette.range[0], 1);
scene.fog = new THREE.FogExp2(palette.range[0], 0.11);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach((o, id) => {

    o.pivot.rotation.y = 0;

    o.meshes.forEach((m, mid) => {
      const s = Maf.parabola(Maf.mod(1 * t + mid / OBJECTS - 3 * id / RINGS, 1), 4);
      m.scale.setScalar(s);
      m.visible = s > .001;
    });

  });

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };