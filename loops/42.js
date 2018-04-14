import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {Curves} from '../third_party/THREE.CurveExtras.js';
import Maf from '../modules/maf.js';
import {TubeBufferGeometry} from '../modules/three-tube-geometry.js';
import easings from '../modules/easings.js';

const canvas = renderer.domElement;
const camera = getCamera();
camera.fov = 120;
camera.zoom = 7;
camera.updateProjectionMatrix();
const scene = new THREE.Scene();
const group = new THREE.Group();

function getMaterial() {
  const material = new THREE.MeshStandardMaterial({ metalness: .05, roughness: .5});
  material.onBeforeCompile = (shader) =>{
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

   shader.fragmentShader = shader.fragmentShader.replace(
      `varying vec3 vViewPosition;`,
      `varying vec3 vViewPosition;
  varying vec3 pos;
  varying vec2 vUv;

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
#define TAU 2.*M_PI

float pattern(float v, float v2) {
  float r2 = smoothstep(0.,1.,.5+.5*cos(2.*opacity*TAU));
  float r = .1;
  float m1 = .5+.5*sin((v + 3.*v2 + 2.*opacity)*TAU*4.);
  float m2 = .2* clamp(.5 + .5*cos((3.*v2)*TAU*10.+8.*(1.-opacity)*TAU),0.,1.);
  float res = mix(m1,m2,r2);
  return smoothstep(.5-r, .5+r, (.75 + 8.*r2)*res);
}
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( diffuse, opacity );
  float r = sqrt(pos.x*pos.x+pos.y*pos.y+pos.z*pos.z);
  float theta = acos(pos.z/r);
  float phi = atan(pos.y,pos.x);
  float strip = pattern(vUv.y, vUv.x);
  float e = .0001;
  vec2 stripOffset = vec2( pattern(vUv.y, vUv.x+e)-strip, pattern(vUv.y+e, vUv.x)-strip);
  float modifiedRoughness = .2 + .3*strip;
  diffuseColor.rgb = vec3(.8*strip);`);

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      roughnessFactor = modifiedRoughness;`
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
  new THREE.TorusKnotBufferGeometry(2.5,1,200,36),
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

camera.position.set(10,-15,10);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  mesh.material.opacity = (time / loopDuration );
  group.rotation.z = (2/3) * time * Maf.TAU / loopDuration;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
