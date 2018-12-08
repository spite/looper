import THREE from '../third_party/three.js';
import { renderer, getOrthoCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import easings from '../modules/easings.js';
import { Post } from '../modules/lines.js';
import pointsOnSphere from '../modules/points-sphere.js';

import { map1 } from '../shaders/map.js';
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
varying float vDepthCenter;
varying float angle;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

${map1}

mat4 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

void main() {
  float a = map(position.y,-.5,.5,0.,4.*TAU);
  angle = a + time * PI;
  float r1 = 1. + .2*sin(.25*a)*cos(time*TAU);
  vec3 center = vec3(r1*cos(a),.5*cos(.25*a + time*TAU), r1*sin(a));
  float b = atan(position.z, position.x);
  float r2 = .025;
  mat4 rot = rotationMatrix(vec3(0.,1.,0.), a);
  vec3 v = center + (rot*vec4(r2 * cos(b), r2 * sin(b), 0.,0.)).xyz;
  vPosition = v;
  vec4 mvPosition = modelViewMatrix * vec4( v, 1. );
  gl_Position = projectionMatrix * mvPosition;
  vDepth = 1.-20.*(abs(gl_Position.z)-0.02);
}
`;

const fragmentShader = `
precision highp float;

uniform float time;

varying float vDepth;
varying float angle;

#define PI 3.1415926535897932384626433832795
#define TAU (2.*PI)

${parabola}

void main(){
  if(mod(angle,.4)<.35*parabola(mod(time+0.*angle/PI,1.),1.)) discard;

  gl_FragColor = vec4(vec3(vDepth),1.);
}
`;

const canvas = renderer.domElement;
const camera = getOrthoCamera(1.5, 1.5);
const controls = new OrbitControls(camera, canvas);
controls.screenSpacePanning = true;
const scene = new THREE.Scene();
const group = new THREE.Group();

const post = new Post(renderer, { minLeveL: .25, maxLevel: .35, gamma: .5 });

const geo = new THREE.CylinderBufferGeometry(1, 1, 1, 36, 200, true);
const mat = new THREE.RawShaderMaterial({
  uniforms: {
    time: { value: 0 }
  },
  vertexShader,
  fragmentShader,
  side: THREE.DoubleSide
})
const mesh = new THREE.Mesh(geo, mat);
group.add(mesh);

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
renderer.setClearColor(0, 1);
scene.fog = new THREE.FogExp2(0, .2);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const q = new THREE.Quaternion();
const m = new THREE.Matrix4();
const p = new THREE.Vector3();

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  mat.uniforms.time.value = t;

  post.render(scene, camera);
}

export { renderer, draw, loopDuration, canvas };