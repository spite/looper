import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import easings from '../modules/easings.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.1 });

palette.range = ["#202020"]; //, "#532DD8", "#EA44B6", "#371ABE", "#FAD1DF", "#520D28", "#E0123A"];

const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(35, 0, -35);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/brush2.png');
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const N = 4;

const geo = new Float32Array(N * 3);
const radius = 2;
const lineWidth = 1;

function prepareMesh(w, c) {

  var g = new MeshLine();
  g.setGeometry(geo, function(p) { return p; });

  const material = new MeshLineMaterial({
    map: strokeTexture,
    useMap: true,
    color: gradient.getAt(c),
    resolution: resolution,
    sizeAttenuation: true,
    lineWidth: w,
    near: camera.near,
    far: camera.far,
    alphaTest: .75 * .5,
    depthWrite: true,
    depthTest: true,
    transparent: true,
    opacity: 1,
    dashArray: new THREE.Vector2(1, 1),
    dashOffset: 0,
  });

  var mesh = new THREE.Mesh(g.geometry, material);
  mesh.geo = geo;
  mesh.g = g;

  return mesh;
}

//const base = new THREE.IcosahedronGeometry(1, 2);
const base = new THREE.TorusKnotGeometry(1, .5, 40, 10);

const meshes = [];
for (let j = 0; j < base.faces.length; j++) {
  const mesh = prepareMesh(1, Maf.randomInRange(0, 1));
  group.add(mesh);
  const offset = Maf.randomInRange(0, 1);
  const vertices = new Float32Array(N * 3);
  const face = base.faces[j];
  const index = ['a', 'b', 'c'];
  const centroid = new THREE.Vector3();
  centroid.x = base.vertices[face.a].x + base.vertices[face.b].x + base.vertices[face.c].x;
  centroid.y = base.vertices[face.a].y + base.vertices[face.b].y + base.vertices[face.c].y;
  centroid.z = base.vertices[face.a].z + base.vertices[face.b].z + base.vertices[face.c].z;
  for (let i = 0; i < N; i++) {
    const v = base.vertices[face[index[i % 3]]];
    const dx = (v.x - centroid.x) / 10;
    const dy = (v.y - centroid.y) / 10;
    const dz = (v.z - centroid.z) / 10;
    vertices[i * 3] = v.x - dx;
    vertices[i * 3 + 1] = v.y - dy;
    vertices[i * 3 + 2] = v.z - dz;
  }
  mesh.g.setGeometry(vertices);
  mesh.scale.setScalar(5);
  meshes.push({ mesh, offset });
}
group.scale.setScalar(1);
scene.add(group);

const loopDuration = 4;
const r = 2;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach((m) => {
    m.mesh.material.uniforms.dashOffset.value = easings.InOutQuad(Maf.mod(2 * t + m.offset, 1));
  });

  group.rotation.y = t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };