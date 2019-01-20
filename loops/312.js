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

float v(vec2 uv, float offset, float t){
  float l = 20.;
  float o = .05 + .95*parabola(mod(1.*uv.x+1.*t+offset,1.),l);
  return o;
}

vec3 color1 = vec3(69.,91.,105.)/255.;
vec3 color2 = vec3(249.,122.,77.)/255.;
vec3 color3 = vec3(195.,58.,78.)/255.;

void main(){
  vec2 s = 1.*vec2(960.,60.);
  vec2 uv = floor(vUv * s)/s;
  vec2 uv2 = mod(vUv*s*vec2(1.,3.),1.);
  float i = floor(mod(vUv.y*s.y*3.,3.));
  float e = 1./3.;
  float t = -2.*time/3.;
  float o1 = v(uv, 0., t);
  float o2 = v(uv, e, t);
  float o3 = v(uv, -e, t);
  float stripe = .5 +.5 * sin(1.*uv.y*TAU-2.*time*TAU);
  float v = 1.-.95*smoothstep(.75,1.,stripe);
  v *= smoothstep(.25,.75,.5 +.5*sin(90.*vUv.x*TAU+30. * time * TAU));
  vec3 color = 2.*vRim*v*(o1*color1+o2*color2+o3*color3)/1.;
  if(i==0.) color.yz *= 0.;
  if(i==1.) color.xz *= 0.;
  if(i==2.) color.xy *= 0.;
  float d = smoothstep(.25,.75,1.-1.*length(uv2-.5));
  gl_FragColor = vec4(1.5*color*d,1.);
  float b = texture2D(matCap,vN).r/3.;
  gl_FragColor = screen(gl_FragColor, vec4(b), .5);
}
`;

const canvas = renderer.domElement;
const camera = getCamera(75, 1, .1, 10);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const post = new Post(renderer, { minLeveL: .25, maxLevel: .5, gamma: 1. });

const r = .2;
const geo = new THREE.TorusKnotBufferGeometry(1, .25, 200, 36, 1, 3);

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
const mesh2 = new THREE.Mesh(geo, mat);
mesh2.rotation.z = 3. * Maf.TAU / 6;
group.add(mesh2);
group.scale.setScalar(.35);

scene.add(group);

camera.position.set(0, 0, 1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.rotation.z -= Maf.PI / 2;
renderer.setClearColor(0x010203, 1);

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = Maf.mod(time / loopDuration - .5, 1);

  mesh.material.uniforms.time.value = t;
  mesh.scale.setScalar(.66 + .33 * Maf.parabola(t, 2));
  mesh2.scale.setScalar(.66 + .33 * Maf.parabola(Maf.mod(t + .5, 1), 2));

  group.rotation.z = t * Maf.TAU / 3;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };