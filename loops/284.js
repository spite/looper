import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { Post } from '../modules/lines-glow.js';

import { parabola } from '../shaders/functions.js';

const vertexShader = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

uniform float time;

varying vec3 vPosition;
varying float vDepth;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1. );
  gl_Position = projectionMatrix * mvPosition;
  vDepth = 1.-20.*(abs(gl_Position.z)-0.02);
}
`;

const fragmentShader = `
precision highp float;

uniform float time;
uniform float offset;
uniform vec3 color;

varying float vDepth;
varying vec2 vUv;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

${parabola}

void main(){
  if(mod(offset+5.*(time+vUv.x+vUv.y/5.),1.)<.95-.1*parabola(time,1.)) discard;
  gl_FragColor = vec4(.5*color*vDepth*parabola(mod(vUv.y+vUv.x+time,1.),1.),1.);
}
`;

const canvas = renderer.domElement;
const camera = getOrthoCamera(2, 2);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const post = new Post(renderer, { minLeveL: .25, maxLevel: .5, gamma: 1. });

const geo = new THREE.TorusKnotBufferGeometry(1, .33, 200, 36, 1, 3);
const mat = new THREE.RawShaderMaterial({
  uniforms: {
    time: { value: 0 },
    offset: { value: 0 },
    color: { value: new THREE.Color(0x33A2CA) }
  },
  vertexShader,
  fragmentShader,
  side: THREE.DoubleSide,
  wireframe: false
})
const mesh = new THREE.Mesh(geo, mat);
group.add(mesh);
const mesh2 = new THREE.Mesh(geo, mat.clone());
mesh2.material.uniforms.offset.value = 1 / 3;
mesh2.material.uniforms.color.value.setHex(0x5B738A);
group.add(mesh2);
const mesh3 = new THREE.Mesh(geo, mat.clone());
mesh3.material.uniforms.offset.value = 2 / 3;
mesh3.material.uniforms.color.value.setHex(0xF8761F);
group.add(mesh3);

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

const light = new THREE.HemisphereLight(0x776E88, 0xffffff, .5);
scene.add(light);

camera.position.set(-1.375343675934189, 3.9021520366916516, 2.807425734656406);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.setClearColor(0x010203, 1);
scene.fog = new THREE.FogExp2(0x010203, .2);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 6;
const q = new THREE.Quaternion();
const m = new THREE.Matrix4();
const p = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  mesh.material.uniforms.time.value = t;
  mesh2.material.uniforms.time.value = t;
  mesh3.material.uniforms.time.value = t;

  group.rotation.y = t * Maf.TAU;
  group.rotation.z = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };