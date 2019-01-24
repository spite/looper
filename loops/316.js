import THREE from '../third_party/three.js';
import { renderer, getCamera, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { Post } from '../modules/lines-glow.js';
import { Curves } from '../third_party/THREE.CurveExtras.js';
import { TubeBufferGeometry } from '../modules/three-tube-geometry.js';

import { parabola } from '../shaders/functions.js';
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

${parabola}

void main() {
  vUv = uv;
  vec4 p = vec4(position ,1.);
  vec4 mvPosition = modelViewMatrix * p;
  gl_Position = projectionMatrix * mvPosition;
  vec3 e = normalize( mvPosition.xyz);
  vec3 n = normalize( normalMatrix * normal );
  vRim = pow(abs(dot(e,n)),2.);
  vDepth = 1.5-20.*abs(gl_Position.z);
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
varying float vRim;
varying vec2 vN;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

${parabola}
${screen}

vec3 color1 = vec3(69.,91.,105.)/255.;
vec3 color2 = vec3(236.,40.,31.)/255.;
vec3 color3 = vec3(195.,58.,78.)/255.;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main(){
  float t = 3.*time/5.;

  vec2 s = vec2(100.,10.);
  vec2 uv = vUv+vec2(0.,.0);
  vec2 uv1 = floor(uv * s)/s;
  float r = parabola(mod(uv.x + t,1.), 10.);
  vec3 color = vec3(r, uv.y, 0.);
  vec2 uv2 = mod(uv*s, vec2(1.));
  float lx = length(uv2.x-.5);
  float ly = length(uv2.y-.5);
  float l = max(lx,ly);
  if(step(r,l)>.5) discard;
  color = color2 / 9.;
  color += step(r-.1,l)/2.;
  color += (1.-parabola(mod(uv.x + t,1.), 1.)) /10.;

  gl_FragColor = vec4((.75+.25*vRim)*color,1.);
  float b = texture2D(matCap,vN).r/5.;
  gl_FragColor = screen(gl_FragColor, vec4(b), .5);
}
`;

const canvas = renderer.domElement;
const camera = getCamera(45, 1, .1, 10); //getOrthoCamera(2.25, 2.25);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const post = new Post(renderer, { minLeveL: .25, maxLevel: .5, gamma: 1. });

const r = .2;
const curve = new THREE.Curves.CinquefoilKnot();
const geo = new TubeBufferGeometry(curve, 200, 6, 36, true);

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
  side: THREE.DoubleSide,
})
const mesh = new THREE.Mesh(geo, mat);
group.scale.setScalar(.4);
group.add(mesh);
const geo2 = new TubeBufferGeometry(curve, 200, 6, 36, true);
const mesh2 = new THREE.Mesh(geo2, mat.clone());
mesh2.material.uniforms.matCap.value = mesh.material.uniforms.matCap.value
mesh2.material.uniforms.offset.value = .5;
mesh2.material.uniforms.speed.value = 2;
mesh2.rotation.z = Maf.TAU / 6;
mesh2.scale.setScalar(.75);
group.add(mesh2);

group.scale.setScalar(.01);

scene.add(group);

camera.position.set(0, 0, 1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.rotation.z -= Maf.PI / 2;
renderer.setClearColor(0x010203, 1);

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  mesh.material.uniforms.time.value = t
  mesh2.material.uniforms.time.value = t
  group.rotation.z = 1 * t * Maf.TAU / 5;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };