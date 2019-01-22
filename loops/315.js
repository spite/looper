import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { Post } from '../modules/lines-glow.js';
import { Curves } from '../third_party/THREE.CurveExtras.js';
import { TubeBufferGeometry } from '../modules/three-tube-geometry.js';

import { parabola } from '../shaders/functions.js';
import noise2d from '../shaders/noise2d.js';
import screen from '../shaders/screen.js';

const vertexShader = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform mat3 normalMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

uniform float time;
uniform float offset;

varying vec3 vPosition;
varying vec2 vUv;
varying float vDepth;
varying float vRim;
varying vec2 vN;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

void main() {
  vUv = uv;
  vec3 p = position;
  vec4 mvPosition = modelViewMatrix * vec4( p, 1. );
  vPosition = (modelMatrix*vec4(position,1.)).xyz;
  gl_Position = projectionMatrix * mvPosition;
  vDepth = 1.5-20.*abs(gl_Position.z);
  vec3 e = normalize( (modelViewMatrix*vec4(cameraPosition,1.)).xyz);
  vec3 n = normalize( normalMatrix * normal );
  vRim = pow(abs(dot(e,n)),2.);
  e = normalize( mvPosition.xyz);
  vec3 r = reflect( e, n );
  float m = 2.82842712474619 * sqrt( r.z+1.0 );
  vN = r.xy / m + .5;
}
`;

const fragmentShader = `
precision highp float;

uniform float time;
uniform float offset;
uniform vec3 color;
uniform float speed;
uniform sampler2D matCap;

varying vec2 vUv;
varying float vDepth;
varying vec3 vPosition;
varying float vRim;
varying vec2 vN;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

${parabola}
${noise2d}
${screen}

float v(vec2 uv, float offset, float t){
  float l = 50.+100.*offset;
  float o = .1 + .9*parabola(mod(5.*vUv.x+5.*t+offset+2.*time,1.),l);
  return o;
}

vec3 color1 = vec3(69., 91., 105.)/255.;
vec3 color2 = vec3(249.,122.,77.)/255.;
vec3 color3 = vec3(195.,58.,78.)/255.;

void main(){
  float e = 1./3.;
  float t = -1.*time/5.;
  float o1 = v(vUv, 0., t);
  float o2 = v(vUv, e, t);
  float o3 = v(vUv, -e, t);
  float gradient = .5*(o1+o2+o3);
  gl_FragColor = vRim*vec4(gradient*(o1*color1+o2*color2+o3*color3)/2.,1.);
  float b = texture2D(matCap,vN).r/6.;
  gl_FragColor = screen(gl_FragColor, vec4(b), .75);
}
`;

const canvas = renderer.domElement;
const camera = getCamera(45, 1, .1, 10);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const post = new Post(renderer, { minLeveL: .25, maxLevel: .5, gamma: 1. });

const r = .2;
const curve = new THREE.Curves.CinquefoilKnot();
const geo = new TubeBufferGeometry(curve, 200, 4, 36, true);

const loader = new THREE.TextureLoader();

const mat = new THREE.RawShaderMaterial({
  uniforms: {
    time: { value: 0 },
    speed: { value: 1 },
    offset: { value: 0 },
    color: { value: new THREE.Color(0x455b69) },
    matCap: { value: loader.load('./assets/matcap3.jpg') }
  },
  vertexShader,
  fragmentShader,
  wireframe: false,
  side: THREE.DoubleSide
})
const mesh = new THREE.Mesh(geo, mat);
group.add(mesh);

const e = 1 / 10;
const mesh0 = new THREE.Mesh(geo, mat);
mesh0.rotation.z = (1 / 4) * Maf.TAU / 10;
mesh0.material.uniforms.offset.value = 1 * e;
group.add(mesh0);

const mesh1 = new THREE.Mesh(geo, mat);
mesh1.rotation.z = (2 / 4) * Maf.TAU / 10;
mesh1.material.uniforms.offset.value = 2 * e;
group.add(mesh1);

const mesh2 = new THREE.Mesh(geo, mat);
mesh2.rotation.z = (3 / 4) * Maf.TAU / 10;
mesh2.material.uniforms.offset.value = 3 * e;
group.add(mesh2);

const mesh3 = new THREE.Mesh(geo, mat);
mesh3.rotation.z = (4 / 4) * Maf.TAU / 10;
mesh3.material.uniforms.offset.value = 4 * e;
group.add(mesh3);

group.scale.setScalar(.009);

scene.add(group);

camera.position.set(0, 0, 1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.rotation.z -= Maf.PI / 2;
renderer.setClearColor(0x010203, 1);

const loopDuration = 6;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = Maf.mod(time / loopDuration - .5, 1);

  mesh.material.uniforms.time.value = t;
  mesh0.material.uniforms.time.value = t;
  mesh1.material.uniforms.time.value = t;
  mesh2.material.uniforms.time.value = t;

  mesh.scale.setScalar(.9);
  mesh0.scale.setScalar(1);
  mesh1.scale.setScalar(1.1);
  mesh2.scale.setScalar(1);
  mesh3.scale.setScalar(.9);

  group.rotation.z = 3 * t * Maf.TAU / 5;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };