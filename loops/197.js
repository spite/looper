import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { createBolt, boltMaterial } from '../modules/bolt.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.1 });

palette.range = ["#FE910F", "#A30F0B", "#D8180A", "#D2670D", "#FE910F"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(1.4, 1.4);
const controls = new OrbitControls(camera, canvas);
const scene = new THREE.Scene();
const group = new THREE.Group();

group.scale.setScalar(.1);

const floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(100, 100), new THREE.MeshStandardMaterial());
floor.rotation.x = Math.PI;
floor.position.z = 5;
floor.receiveShadow = true;
group.add(floor);

const bolt = createBolt();
group.add(bolt);

const geometry = RoundedFlatTorus(5, 20, 60, .1);
const box = new THREE.Mesh(geometry, boltMaterial);
box.rotation.x = Math.PI / 2;
box.position.z = 2;
box.receiveShadow = box.castShadow = true;
group.add(box);
const box2 = box.clone();
group.add(box2);
const box3 = box.clone();
group.add(box3);

scene.add(group);

const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
directionalLight.position.set(-2, 2, 2);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = -1;
directionalLight.shadow.camera.far = 10;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
directionalLight2.shadow.camera.near = -4;
directionalLight2.shadow.camera.far = 10;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(palette.range[0], palette.range[1], .5);
scene.add(light);

camera.position.set(0, 1, 1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(palette.range[0], 1);
scene.fog = new THREE.FogExp2(palette.range[0], 0.065);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

group.rotation.x = Math.PI / 2;
const loopDuration = 2;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  const d = 30;
  if (t < .2) {
    box.position.x = Maf.map(0, .2, -d, 0, t);
    box2.position.x = Maf.map(0, .2, -2 * d, -d, t);
    box3.position.x = Maf.map(0, .2, 0, d, t);
    bolt.position.x = 0;
    bolt.position.z = -2 * d;
  } else if (t < .8) {
    box.position.x = 0;
    box2.position.x = -d;
    box3.position.x = d;
    bolt.position.x = 0;
    bolt.position.z = Maf.map(.2, .8, -2 * d, 2, t);
    bolt.rotation.z = 4 * t * Maf.TAU;
  } else {
    bolt.position.z = 2;
    bolt.position.x = Maf.map(.8, 1, 0, d, t);
    box.position.x = Maf.map(.8, 1, 0, d, t);
    box2.position.x = Maf.map(.8, 1, -2 * d, -d, t);
    box3.position.x = Maf.map(.8, 1, -d, 0, t);
  }

  if (t > .75 && t < .85) {
    group.position.y = -.4 - .2 * Maf.parabola(1 - easings.OutQuad(Maf.map(.75, .85, 0, 1, t)), 1);
  } else {
    group.position.y = -.4;
  }

  //group.rotation.z = t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };