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
  float l = 10.;
  float o = .05 + .95*parabola(mod(1.*vUv.x+1.*t+offset+2.*time,1.),l);
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

  vec2 s = vec2(50.,5.);
  vec2 uv = vUv + vec2(0.,time-10.*vUv.x);
  vec2 uv1 = floor(uv * s)/s;
  float r = parabola(mod(uv.x+4.*time/5.,1.), 3.);
  vec2 uv2 = mod(uv*s, vec2(1.));
  float lx = length(uv2.x-.5);
  float ly = length(uv2.y-.5);
  float l = max(lx,ly);
  if(step(r,l)>.5) discard;
  vec4 color = vRim*vec4(gradient*(o1*color1+o2*color2+o3*color3)/3.,1.);
  color += step(r-.05,l)/3.;
  float b = texture2D(matCap,vN).r/3.;
  gl_FragColor = screen(color, vec4(b), .75);
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
  side: THREE.DoubleSide
})
const mesh = new THREE.Mesh(geo, mat);
group.add(mesh);

const geo0 = new TubeBufferGeometry(curve, 200, 4, 36, true);
const mesh0 = new THREE.Mesh(geo0, mat.clone());
mesh0.material.uniforms.offset.value = 10;
group.add(mesh0);

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

  group.rotation.x = .25 * Math.cos(2 * t * Maf.TAU);
  group.rotation.y = .25 * Math.sin(2 * t * Maf.TAU);
  group.rotation.z = 3 * t * Maf.TAU / 5;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };