import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
import { palette2 as palette } from '../modules/floriandelooij.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: .1 });

palette.range = ["#FFFFFF", "#FE2F04", "#0D5B93", "#0E4366", "#C74619", "#F5B067", "#F5C893", "#477C93"]; //["#070707", "#B8D00D", "#FFFFFF", "#59620A", "#C6C99E", "#515343", "#78870B"];//["#665609", "#FEFEFD", "#CCCA06", "#C7C1A1", "#A19848", "#86782E", "#4F3B00"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(3, 3);
const scene = new THREE.Scene();
const group = new THREE.Group();

const objects = [];

const RINGS = 40;
const OBJECTS = 16;
const geo = new RoundedBoxGeometry(.1, .25, .25, .025, 4);
const mats = palette.range
  .map((c) => new THREE.MeshStandardMaterial({ color: c, metalness: .1, roughness: .5 }));

for (let j = 0; j < RINGS; j++) {
  const pivot = new THREE.Group();
  const meshes = [];
  const centers = [];

  for (let k = 0; k < OBJECTS; k++) {
    const mesh = new THREE.Mesh(geo, mats[Math.floor(Math.random() * mats.length)]);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.scale.x = Maf.randomInRange(.5, 5);
    mesh.userData.scale = mesh.scale.x;
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

const ambientLight = new THREE.AmbientLight(0x808080, .25);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(palette.range[0], palette.range[1], .5);
scene.add(light);

camera.position.set(0, 6, 6);
camera.lookAt(new THREE.Vector3(0, -3, -3));
camera.rotation.z = -3 * Math.PI / 4;
renderer.setClearColor(palette.range[6], 1);
scene.fog = new THREE.FogExp2(palette.range[6], 0.12);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach((o, id) => {
    const a = id * Maf.TAU / objects.length;
    const r = 2;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);

    o.pivot.position.set(x, y, 0);
    o.pivot.rotation.z = a;

    o.meshes.forEach((m, mid) => {
      const a2 = id * Maf.TAU / RINGS + t * Maf.TAU + mid * Maf.TAU / OBJECTS;
      const r2 = .75 + .5 * Math.sin(a2);
      const x2 = r2 * Math.cos(a2);
      const y2 = r2 * Math.sin(a2);
      m.rotation.y = -a2;
      m.position.set(x2, 0, y2);
      const d = Math.sqrt(x2 * x2 + y2 * y2);
      const s = Maf.parabola(Maf.mod(1 * t - 1 * id / RINGS + 2 * mid / OBJECTS, 1), 2);
      const ss = (s * (.15 * Math.pow(d * 5, 1.3)));
      m.scale.z = m.scale.y = ss;
      m.scale.x = m.userData.scale * ss;
      m.visible = (m.scale.x > .001);
    });

  });

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };