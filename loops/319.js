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

#define M_PI 3.14159265358979323846

float rand(vec2 co){return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);}
float rand (vec2 co, float l) {return rand(vec2(rand(co), l));}
float rand (vec2 co, float l, float t) {return rand(vec2(rand(co, l), t));}

float perlin(vec2 p, float dim, float time) {
  vec2 pos = floor(p * dim);
  vec2 posx = pos + vec2(1.0, 0.0);
  vec2 posy = pos + vec2(0.0, 1.0);
  vec2 posxy = pos + vec2(1.0);

  float c = rand(pos, dim, time);
  float cx = rand(posx, dim, time);
  float cy = rand(posy, dim, time);
  float cxy = rand(posxy, dim, time);

  vec2 d = fract(p * dim);
  d = -0.5 * cos(d * M_PI) + 0.5;

  float ccx = mix(c, cx, d.x);
  float cycxy = mix(cy, cxy, d.x);
  float center = mix(ccx, cycxy, d.y);

  return center * 2.0 - 1.0;
}

// p must be normalized!
float perlin(vec2 p, float dim) {
  return perlin(p, dim, 0.0);
}

#define OCTAVES 6
float p(vec2 uv) {
  // Initial values
  float value = 0.0;
  float amplitude = .5;
  float frequency = 0.;
  float dim = 10.;
  // Loop of octaves
  for (int i = 0; i < OCTAVES; i++) {
    value += amplitude * perlin(uv, dim);
    dim *= 2.;
    amplitude *= .5;
  }
  return value;
}

float v(vec2 uv, float offset, float t, float speed){
  float l = 10.;
  float o = .05 + .95*parabola(mod(1.*uv.x+1.*t+offset+time,1.),l);
  return o;
}

vec3 color1 = vec3(69.,91.,105.)/255.;
vec3 color2 = vec3(249.,122.,77.)/255.;
vec3 color3 = vec3(195.,58.,78.)/255.;

void main(){
  float e = 1./3.;
  float t = 2.*time/3.;
  vec2 uv = vUv;
  float o1 = v(uv, 0., t,1.);
  float o2 = v(uv, e, t,2.);
  float o3 = v(uv, -e, t,3.);
  vec3 color = vRim*(o1*color1+o2*color2+o3*color3)/1.;
  vec2 c = mod(vec2(3.,1.)*vUv+vec2(time,t),vec2(1.));
  vec2 ss = vec2(100.,10.);
  float n = p(mod(vUv * vec2(3.,1.) + vec2(time,0.), vec2(1.)) * vec2(1., 1.));
  n -= .5;
  n += 2.*parabola(mod(vUv.x+t,1.),1.);
  float n2 = 1.-smoothstep(.15,.85,n);
  n2 *= 1.-parabola(mod(vUv.x+t,1.),5.);
  if(n<.5) discard;
  color += 3.*n2;
  color /= 3.;
  float b = texture2D(matCap,vN).r/3.;
  gl_FragColor = screen(vec4(color,1.), vec4(b), .5);
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
const geo = new THREE.TorusKnotBufferGeometry(.5, .15, 200, 36);

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
group.scale.setScalar(.4);
group.add(mesh);

scene.add(group);

camera.position.set(0, 0, 1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.rotation.z -= Maf.PI / 2;
renderer.setClearColor(0x010203, 1);

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  mesh.material.uniforms.time.value = t;
  group.rotation.z = t * Maf.TAU / 3;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };