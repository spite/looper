import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { Post } from '../modules/lines-glow.js';

import { parabola } from '../shaders/functions.js';
import noise3d from '../shaders/noise3d.js';

const vertexShader = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

uniform float time;
uniform float offset;

varying vec3 vPosition;
varying vec2 vUv;
varying float vDepth;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

void main() {
  vUv = uv;
  vec3 p = position;
  vec4 mvPosition = modelViewMatrix * vec4( p, 1. );
  vPosition = mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
  vDepth = 1.5-20.*abs(gl_Position.z);
}
`;

const fragmentShader = `
precision highp float;

uniform float time;
uniform float offset;
uniform vec3 color;
uniform float speed;

varying vec2 vUv;
varying float vDepth;
varying vec3 vPosition;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

${parabola}
${noise3d}

void main(){
  float f = .5 + .5* noise3d(.5*vPosition+vec3(0,0,speed*10.*offset));
  f = smoothstep(.25,.75,f) + smoothstep(.45,.55,f);
  float o = parabola(mod(vUv.y+speed*time+offset,1.),100.);
  o *= parabola(mod(10.*vUv.x+speed*time+offset,1.),5.);
  if(.5+.5*sin((vUv.x+offset+time/10.)*TAU*200.)>smoothstep(0.,1.,.9-.8*parabola(time,1.))) o = 0.;
  o +=.001;
  vec3 col = vDepth*f*color/3.;
  gl_FragColor = vec4(col,o);
}
`;

const canvas = renderer.domElement;
const camera = getOrthoCamera(2.25, 2.25);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const post = new Post(renderer, { minLeveL: .25, maxLevel: .5, gamma: 1. });

const geo = new THREE.TorusKnotBufferGeometry(1, .25, 200, 36, 2, 6);
const mat = new THREE.RawShaderMaterial({
  uniforms: {
    time: { value: 0 },
    speed: { value: 1 },
    offset: { value: 0 },
    color: { value: new THREE.Color(0xe34a4c) }
  },
  vertexShader,
  fragmentShader,
  transparent: true,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
  wireframe: false,
  side: THREE.DoubleSide
})
const mesh = new THREE.Mesh(geo, mat);
group.add(mesh);
const e = .1;
const mesh2 = new THREE.Mesh(geo, mat.clone());
mesh2.material.uniforms.offset.value = e;
mesh2.material.uniforms.speed.value = 2;
mesh2.material.uniforms.color.value.setHex(0x92c8d4);
group.add(mesh2);
const mesh3 = new THREE.Mesh(geo, mat.clone());
mesh3.material.uniforms.offset.value = -e;
mesh3.material.uniforms.speed.value = 3;
mesh3.material.uniforms.color.value.setHex(0xf09343);
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

camera.position.set(0, 0, -2);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.rotation.z -= Maf.PI / 2;
renderer.setClearColor(0x010203, 1);
scene.fog = new THREE.FogExp2(0x010203, .2);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 8;
const q = new THREE.Quaternion();
const m = new THREE.Matrix4();
const p = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = Maf.mod(time / loopDuration - .25, 1);

  mesh.material.uniforms.time.value = t;
  mesh2.material.uniforms.time.value = t;
  mesh3.material.uniforms.time.value = t;

  group.rotation.z = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };