import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { Post } from '../modules/lines-glow.js';
import { Curves } from '../third_party/THREE.CurveExtras.js';
import { TubeBufferGeometry } from '../modules/three-tube-geometry.js';

import { parabola } from '../shaders/functions.js';

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

${parabola}

void main() {
  vUv = uv;
  vec3 p = position;
  vec4 mvPosition = modelViewMatrix * vec4( p, 1. );
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

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

${parabola}

float v(vec2 uv, float offset, float time){
  float r = 1./8.;
  float t = parabola(time,4.)*.1;
  float ox = length(mod((vUv.x+vUv.y/100. + time/10.)*r*400.+offset,1.)-.5);
  float oy = length(mod((vUv.y)*r*36.,1.)-.5);
  float o = length(vec2(ox,oy));
  o = 1.-smoothstep(.05+t,.1+t,o);
  o=clamp(o,0.,1.);
  return o;
}

vec3 color1 = vec3(144.,214.,207.)/255.;
vec3 color2 = vec3(224.,127.,52.)/255.;
vec3 color3 = vec3(219.,69.,67.)/255.;

void main(){
  float e = time;
  float o1 = v(vUv, 0., time);
  float o2 = v(vUv, e, time);
  float o3 = v(vUv, -e, time);
  if(o1<.5&&o2<.5&&o3<.5) discard;
  float f = parabola(mod(vUv.x+6.*time,1.),2.);
  gl_FragColor = vec4((o1*color1 +o2*color2+o3*color3)/3.*f,1.);
}
`;

const canvas = renderer.domElement;
const camera = getOrthoCamera(2.25, 2.25);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const post = new Post(renderer, { minLeveL: .25, maxLevel: .5, gamma: 1. });

const r = .2;
const curve = new THREE.Curves.TrefoilKnot();
const geo = new TubeBufferGeometry(curve, 200, 5, 36, true);

const mat = new THREE.RawShaderMaterial({
  uniforms: {
    time: { value: 0 },
    speed: { value: 1 },
    offset: { value: 0 },
    color: { value: new THREE.Color(0x455b69) }
  },
  vertexShader,
  fragmentShader,
  wireframe: false,
  side: THREE.DoubleSide
})
const mesh = new THREE.Mesh(geo, mat);
group.add(mesh);
group.scale.setScalar(.05);

scene.add(group);

camera.position.set(0, 0, 1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.rotation.z -= Maf.PI / 2;
renderer.setClearColor(0x010203, 1);

const loopDuration = 8;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = Maf.mod(time / loopDuration - .5, 1);

  mesh.material.uniforms.time.value = t;

  group.rotation.x = t * Maf.TAU;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };