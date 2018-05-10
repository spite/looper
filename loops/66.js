import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const material = new THREE.MeshStandardMaterial({
  wireframe: !true,
  color: 0xb70000,
  metalness: 0,
  roughness: .5,
  side: THREE.DoubleSide
});

const colors = [
  new THREE.Color().setHex(0xfd6c22),
  new THREE.Color().setHex(0xfcd748),
  new THREE.Color().setHex(0x32e8b7),
  new THREE.Color().setHex(0x5571fa),
];

const geo = new THREE.IcosahedronBufferGeometry(1.5, 3);
const objects = [];
const objects2 = [];
const objects3 = [];
for (let j = 0; j < 42; j++) {
  const m = material.clone();
  m.color = colors[Math.floor(Math.random() * colors.length)];
  const mesh = new THREE.Mesh(geo, m);
  group.add(mesh);
  mesh.castShadow = mesh.receiveShadow = true;
  objects.push({ mesh, id: j });
  const m2 = mesh.clone();
  group.add(m2);
  objects2.push({ mesh: m2, id: j });
  const m3 = mesh.clone();
  group.add(m3);
  objects3.push({ mesh: m3, id: j });
}
scene.add(group);
scene.scale.setScalar(.5, .5, .5);
scene.rotation.z = -.2;

const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
directionalLight.position.set(-1, 1, 1);
directionalLight.castShadow = true;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(0xcefeff, 0xb3eaf0, .5);
scene.add(light);

camera.position.set(0, 0, 18);
camera.lookAt(scene.position);
renderer.setClearColor(0xffffff, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  const h = 40 + 10 * Math.sin(t * Maf.TAU);
  for (let j = 0; j < objects.length; j++) {
    const o = objects[j];
    const seq = Math.round(o.id / 3) / (objects.length / 3);
    const r = 4 + 2 * Math.sin(seq * Maf.TAU + 2 * t * Maf.TAU);
    const a = (o.id % 3) * Maf.TAU / 3 + seq * Maf.TAU + t * Maf.TAU;
    const x = r * Math.cos(a);
    const y = seq * h - h + t * h;
    const z = r * Math.sin(a);
    const scale = .75 + .5 * (.5 + .5 * Math.cos(-2 * t * Maf.TAU - 2 * seq * Maf.TAU));
    o.mesh.position.set(x, y, z);
    o.mesh.scale.setScalar(scale);
    const o2 = objects2[j];
    o2.mesh.position.set(x, y - h, z);
    o2.mesh.scale.setScalar(scale);
    const o3 = objects3[j];
    o3.mesh.position.set(x, y + h, z);
    o3.mesh.scale.setScalar(scale);
  }

  const scale = .75 + .5 * Maf.parabola(easings.InOutQuad(t), 2);
  scene.scale.setScalar(.5 * scale);

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
