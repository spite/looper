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

camera.position.set(-7.5, -10, -22);
camera.lookAt(group.position);
camera.rotation.z = .1;
renderer.setClearColor(0xd0e6f9, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/brush4.png');
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const N = 400;
const LINES = 10;

const geo = new Float32Array(N * 3);

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
    opacity: .75,
  });

  var mesh = new THREE.Mesh(g.geometry, material);
  mesh.geo = geo;
  mesh.g = g;

  return mesh;
}

const meshes = [];
for (let j = 0; j < LINES; j++) {
  const mesh = prepareMesh(Maf.randomInRange(1, 2), Maf.randomInRange(0, 1));
  group.add(mesh);
  mesh.scale.setScalar(1 + .1 * j);
  //mesh.rotation.set(Maf.randomInRange(0, Maf.TAU), Maf.randomInRange(0, Maf.TAU), Maf.randomInRange(0, Maf.TAU));
  mesh.rotation.y = j * Maf.TAU / LINES;
  const offset = 0; //Maf.randomInRange(0, Maf.TAU);
  const twist = 1; //Maf.randomInRange(.25, 1);
  meshes.push({ mesh, offset, twist });
}
group.scale.setScalar(1.5);
scene.add(group);

const loopDuration = 4;
const r = 2;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach((m) => {
    const q = m.twist; //easings.InOutQuad(.5 + .5 * Math.cos(Maf.PI + t * Maf.TAU + m.offset));
    const vertices = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const tw = 2.5 * Math.PI * q;
      const th = .25 * i * Maf.TAU / N + (t + m.offset) * 1 * Maf.TAU;

      const ph = Math.cos(th) * tw;
      const y = r * Math.cos(th);
      const x = r * Math.sin(th) * Math.cos(ph);
      const z = r * Math.sin(th) * Math.sin(ph);

      vertices[i * 3] = x;
      vertices[i * 3 + 1] = y;
      vertices[i * 3 + 2] = z;
    }
    //m.mesh.rotation.y = m.offset + t * Maf.TAU;
    m.mesh.g.setGeometry(vertices);
  })

  //group.rotation.y = t * Maf.TAU;

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };