import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';
import { palette2 as palette } from '../modules/floriandelooij.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: .1 });

palette.range =   ["#081D2A", "#80D0F6", "#FA9040", "#FEA418", "#ED5A34", "#F2EDD4", "#4E2813"]; //["#91A00A", "#6AB4A2", "#C5CAB1", "#352A07", "#966F27", "#C4B159"]; //  ["#FFB365", "#E28D0D", "#2A2826", "#B06D31", "#B78551"]; // ["#E59D50", "#1A588F", "#F08C36", "#C1561D", "#467899", "#508DB5"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(3, 3);
const scene = new THREE.Scene();
const group = new THREE.Group();

const objects = [];

const RINGS = 20;
const OBJECTS = 7;
const l = Maf.TAU / OBJECTS;
const geos = [
  new RoundedExtrudedPolygonGeometry(.25, .025, 6, 1, .05, .025, 5),
  new RoundedExtrudedPolygonGeometry(.25, .05, 6, 1, .05, .025, 5),
  new RoundedExtrudedPolygonGeometry(.25, .075, 6, 1, .05, .025, 5)
];
const mats = palette.range
  .map((c) => new THREE.MeshStandardMaterial({ color: c, metalness: .1, roughness: .5 }));

for (let j = 0; j < RINGS; j++) {
  const base = new THREE.Group();
  const pivot = new THREE.Group();
  const a = j * Maf.TAU / RINGS;
  const r = 2;
  const x = r * Math.cos(a);
  const y = r * Math.sin(a);
  base.position.set(x, y, 0);
  base.rotation.z = a;
  base.add(pivot);

  const meshes = [];
  const centers = [];

  for (let k = 0; k < OBJECTS; k++) {
    const mesh = new THREE.Mesh(geos[Math.floor(Math.random() * geos.length)], mats[Math.floor(Math.random() * mats.length)]);
    mesh.castShadow = mesh.receiveShadow = true;
    const a = k * Maf.TAU / OBJECTS + (j % 2 ? 0 : Maf.TAU / (2 * OBJECTS));
    const r = 1;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    mesh.userData.scale = Maf.randomInRange(.5, 1.1);
    mesh.position.set(x, 0, y);
    mesh.rotation.y = -a + Math.PI / 2;
    mesh.rotation.z = Maf.TAU / 12;
    pivot.add(mesh);
    meshes.push(mesh);
  }

  objects.push({ meshes, pivot });
  group.add(base);
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
renderer.setClearColor(palette.range[3], 1);
scene.fog = new THREE.FogExp2(palette.range[3], 0.11);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach((o, id) => {

    o.pivot.rotation.y = t * Maf.TAU;

    o.meshes.forEach((m, mid) => {
      const s = .4 + .6 * Maf.mod(Maf.parabola(.0001 + Maf.mod(-.9999 * t + mid / OBJECTS - .5, 1), 2), 1);
      m.scale.setScalar(s * m.userData.scale * 2);
    });

  });

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };