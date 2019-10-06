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

palette.range = ["#F62D62", "#FFFFFF", "#FDB600", "#F42D2D", "#544C98", "#ECACBC"];

const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true

camera.position.set(35, 15, -35);
camera.lookAt(group.position);
renderer.setClearColor(0xd0e6f9, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/brush4.png');
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const N = 40;

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
const base = new THREE.TorusKnotGeometry(1, .25, 40, 10, 1, 2);

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
  const a = new THREE.Vector3();
  const r = Maf.randomInRange(.5, 1.5);
  for (let i = 0; i < N; i++) {
    a.set(0, .5, 0).applyAxisAngle(face.normal, i * Maf.TAU / N).multiplyScalar(r).add(centroid);
    vertices[i * 3] = a.x;
    vertices[i * 3 + 1] = a.y;
    vertices[i * 3 + 2] = a.z;
  }
  mesh.g.setGeometry(vertices);
  mesh.scale.setScalar(5);
  meshes.push({ mesh, offset });
}
group.scale.setScalar(.5);
scene.add(group);

const loopDuration = 3;
const r = 2;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach((m) => {
    m.mesh.material.uniforms.dashOffset.value = -Maf.mod(4 * t + m.offset, 1);
  });

  group.rotation.y = t * Maf.TAU;
  group.rotation.z = Maf.TAU / 16;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };