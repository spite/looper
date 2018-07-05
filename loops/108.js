import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {Curves} from '../third_party/THREE.CurveExtras.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

function getMaterial() {
  const material = new THREE.MeshStandardMaterial({color: 0x5186a6, metalness: .1, roughness: .5});
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

// form https://www.shadertoy.com/view/XdKXz3
float pattern( vec2 uv ) {

  float f = 1.5;
  uv.x *= 2.;
  vec2 R = vec2(1.),
  U = uv = (uv-R/2.)/R.y * 6. *  f/2.;          // centered coords

  U *= mat2(1,-1./f, 0,2./f);                     // conversion to
  vec3 g = vec3(U, 1.-U.x-U.y), g2,                     // hexagonal coordinates
  id = floor(g);                                      // cell id

  g = fract(g);                                         // diamond coords
  g2 = abs(2.*g-1.);                                    // distance to borders

  U = id.xy * mat2(1,.5, 0,f/2.);
  float l00 = length(U-uv),                    // screenspace distance to nodes
  l10 = length(U+vec2(1,0)-uv),
  l01 = length(U+vec2(.5,f/2.)-uv),
  l11 = length(U+vec2(1.5,f/2.)-uv),
    l = min(min(l00, l10), min( l01, l11)); // closest node: l=dist, C=coord
  vec2 C = U+ ( l==l00 ? vec2(0) : l==l10 ? vec2(1,0) : l==l01 ? vec2(.5,f/2.) : vec2(1.5,f/2.) );

  float O = sin(length(40.*l)+2.*M_PI*opacity);

  return O;
}

`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( diffuse, opacity );
  float r = sqrt(pos.x*pos.x+pos.y*pos.y+pos.z*pos.z);
  float theta = acos(pos.z/r);
  float phi = atan(pos.y,pos.x);

  vec2 uv = (vUv+vec2(0.,opacity));
  float h = pattern(uv);

  float stripOffset = h - pattern(uv+vec2(0.,.0001));
  float modifiedRoughness = h;
  diffuseColor.rgb = vec3(h);`);

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      roughnessFactor = modifiedRoughness;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment>',
      `#include <normal_fragment>
      normal = perturbNormalArb( -vViewPosition, normal, vec2( 0., stripOffset ) );`
    );

    shader.fragmentShader = `#extension GL_OES_standard_derivatives : enable
    ${shader.fragmentShader}`;

  }
  return material;
}

const mesh = new THREE.Mesh(
  new THREE.TorusBufferGeometry(3,1.5,36,200),
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
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  mesh.material.opacity = t;
  mesh.rotation.x = Maf.TAU * t;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
