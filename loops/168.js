import THREE from '../third_party/three.js';
import { renderer, getCamera, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';

import Painted from '../modules/painted.js';

const painted = new Painted(renderer);

palette.range =    ["#FF6D00", "#FBF8EB", "#008B99", "#F8E1A6", "#FDA81F", "#B80A01", "#480D07"]; // ["#EF2006", "#350000", "#A11104", "#ED5910", "#F1B52E", "#7B5614", "#F7F1AC"] // ["#D1D1D1", "#A9ACAE", "#101117", "#E04224", "#3D3A44", "#28B074", "#58968E"]; //["#F6D199", "#EDA65D", "#5B3B16", "#1F1408", "#AF551E", "#FEFBF5", "#546A5B"]; //["#D86618", "#E78A23", "#24110B", "#5A2511", "#A1401B", "#5F5749", "#E69958", "#E4B08E"]; //["#070707", "#B8D00D", "#FFFFFF", "#59620A", "#C6C99E", "#515343", "#78870B"];//["#665609", "#FEFEFD", "#CCCA06", "#C7C1A1", "#A19848", "#86782E", "#4F3B00"];

const canvas = renderer.domElement;
const camera = getOrthoCamera(3, 3);
const scene = new THREE.Scene();
const group = new THREE.Group();
const rings = [];

const RINGS = 10;
const RADIUS = 10;

const mat = palette.range
  .map((c) => new THREE.MeshStandardMaterial({ color: c, metalness: .1, roughness: .4 }))
  .sort((a, b) => {
    const ca = a.color.getHSL();
    const cb = b.color.getHSL();
    return ca.h - cb.h;
  });

const OBJECTS = 2 * mat.length;
const l = Maf.TAU / OBJECTS;
const r = 10;
const geo = new RoundedFlatTorus(r, 30, 10, .25, 18, 9, 0, l, true);
const m = new THREE.Matrix4();
m.makeTranslation(0, 0, -r);
geo.applyMatrix(m);

for (let i = 0; i < RINGS; i++) {
  const meshes = [];
  const base = new THREE.Group();
  const a = i * Maf.TAU / RINGS;
  const r2 = 15;
  base.rotation.x = Maf.PI / 2;
  base.rotation.z = a;
  base.position.x = r2 * Math.cos(a);
  base.position.z = r2 * Math.sin(a);
  group.add(base);
  const base2 = new THREE.Group();
  base.add(base2);
  base2.rotation.x = 0 * Math.PI / 4;
  base2.rotation.z = 0 * Math.PI / 4;
  const pivotBase = new THREE.Group();
  base2.add(pivotBase);
  for (let j = 0; j < OBJECTS; j++) {
    const pivot = new THREE.Mesh();
    const mesh = new THREE.Mesh(geo, mat[j % mat.length]); //
    const a = j * Maf.TAU / OBJECTS;
    pivot.rotation.y = -a + Math.PI / 2;
    pivot.position.x = r * Math.cos(a);
    pivot.position.y = .25 * OBJECTS * Math.sin(a);
    pivot.position.z = r * Math.sin(a);
    pivot.add(mesh);
    mesh.castShadow = mesh.receiveShadow = true;
    pivotBase.add(pivot);
    meshes.push({ mesh, y: mesh.position.y, a: mesh.rotation.y });
  }
  rings.push({ base: base2, ring: pivotBase, meshes });
}
group.scale.setScalar(.1);
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

camera.position.set(0, 8, 8);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(palette.range[1], 1);
scene.fog = new THREE.FogExp2(palette.range[1], 0.065);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  rings.forEach((ring, id) => {
    ring.ring.rotation.y = t * Maf.TAU;
    ring.meshes.forEach((mesh, mid) => {
      const s = Maf.parabola(Maf.mod(2 * t + mid / ring.meshes.length - 2 * id / RINGS, 1), 4);
      mesh.mesh.scale.setScalar(s);
      mesh.mesh.visible = s > .001;
    });
  });
  group.rotation.y = -t * Maf.PI;

  painted.render(scene, camera);

}

export { draw, loopDuration, canvas };