import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise3d from '../shaders/noise3d.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

function getMaterial() {
  const material = new THREE.MeshStandardMaterial({color: 0x5186a6, metalness: .1, roughness: .5});
  material.onBeforeCompile = (shader) =>{
    material.uniforms = shader.uniforms;
    shader.uniforms.time = { value: 0 };
    shader.vertexShader = shader.vertexShader.replace(
      `varying vec3 vViewPosition;`,
      `varying vec3 vViewPosition;
  varying vec3 pos;
  varying vec2 vUv;`);
    shader.vertexShader = shader.vertexShader.replace(
      `#include <defaultnormal_vertex>`,
      `#include <defaultnormal_vertex>
  pos = position;
  vUv = uv;`);

    shader.fragmentShader = `${noise3d}

${shader.fragmentShader}`;

   shader.fragmentShader = shader.fragmentShader.replace(
      `varying vec3 vViewPosition;`,
      `varying vec3 vViewPosition;
  varying vec3 pos;
  varying vec2 vUv;
  uniform float time;

vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy ) {
  vec3 vSigmaX = dFdx( surf_pos );
  vec3 vSigmaY = dFdy( surf_pos );
  vec3 vN = surf_norm;    // normalized
  vec3 R1 = cross( vSigmaY, vN );
  vec3 R2 = cross( vN, vSigmaX );
  float fDet = dot( vSigmaX, R1 );
  vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
  return normalize( abs( fDet ) * surf_norm - vGrad );
}

#define M_PI 3.1415926535897932384626433832795

float fBm(in vec3 p) {
    float sum = 0.0;
    float amp = 1.0;
    for(int i = 0; i < 4; i++) {
        sum += amp * noise3d(p);
        amp *= 0.5;
        p *= 2.0;
    }
    return sum;
}

float pattern(vec3 p) {
  float freq = .5;
  float xPeriod = 2.;
  float yPeriod = 1.;
  float zPeriod = .5;
  float amp = 1.;
  return abs(sin(freq * dot(p,vec3(xPeriod, yPeriod, zPeriod)) + amp * fBm(pos)));
}
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( diffuse, opacity );
  float strip = pattern(pos);
  float e = .001;
  float v1 = pattern(pos+vec3(e,0.,0.));
  float v2 = pattern(pos+vec3(0.,e,0.));
  vec2 stripOffset = vec2(v1-strip,v2-strip);
  float c = .5 + .5 * strip;
  if(pos.x>0.) {
    c = 1. - c;
  }
  if(pos.y>0.) {
    c = 1. - c;
  }
  if(pos.z>0.) {
    c = 1. - c;
  }
  float modifiedMetalness = .1;
  float modifiedRoughness = .2 + .3 * c;
  diffuseColor.rgb = vec3(c);
  float rim = .05;
  if( abs(pos.x)<rim || abs(pos.y)<rim || abs(pos.z)<rim) {
    diffuseColor.rgb = vec3(212.,175.,55.)/255.;
    modifiedRoughness = .5;
    modifiedMetalness = 1.;
  }`);

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      roughnessFactor = modifiedRoughness;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <metalnessmap_fragment>',
      `#include <metalnessmap_fragment>
      metalnessFactor = modifiedMetalness;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment>',
      `#include <normal_fragment>
      normal = perturbNormalArb( -vViewPosition, normal, stripOffset );`
    );

    shader.fragmentShader = `#extension GL_OES_standard_derivatives : enable
    ${shader.fragmentShader}`;

  }
  return material;
}

const mesh = new THREE.Mesh(
  new RoundedBoxGeometry(5,5,5,.5,10),
  getMaterial()
);
mesh.receiveShadow = mesh.castShadow = true;
group.add(mesh);

scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-1,1,1);
directionalLight.castShadow = true;
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight2.position.set(1,2,1);
directionalLight2.castShadow = true;
scene.add( directionalLight2 );

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight( 0xcefeff, 0xb3eaf0, .5 );
scene.add( light );

camera.position.set(10,-10,10);
camera.lookAt(group.position);
renderer.setClearColor(0x101010,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;
  const t2 = easings.InOutQuad(t);

  mesh.material.opacity = 1 * time / loopDuration;
  mesh.rotation.y = Math.PI/8 + t2 * Maf.TAU;
  mesh.rotation.x = Math.sin(t2*Maf.TAU) * Math.PI/8;
  if (mesh.material.uniforms) {
    mesh.material.uniforms.time.value = .5 + .5 * Math.sin(t*Maf.TAU);
  }

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
