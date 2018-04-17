import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {MarchingCubes} from '../third_party/THREE.MarchingCubes.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import pointsOnSphere from '../modules/points-sphere.js';

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
  vUv = pos.xy;`);

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
  float offset = .4 * (sin(TAU*opacity));
  return smoothstep( .45 + offset, .55+offset, .5 + .5 * sin( 10. * 2. * M_PI * v + 10. * opacity * 2. * M_PI ) );
}
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( diffuse, opacity );
  float r = sqrt(pos.x*pos.x+pos.y*pos.y+pos.z*pos.z);
  float theta = acos(pos.z/r);
  float phi = atan(pos.y,pos.x);
  float strip = pattern(vUv.y, vUv.x);
  float stripOffset = pattern(vUv.y-.001, vUv.x)-strip;
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
      normal = perturbNormalArb( -vViewPosition, normal, vec2( 0., -stripOffset ) );`
    );

    shader.fragmentShader = `#extension GL_OES_standard_derivatives : enable
    ${shader.fragmentShader}`;

  }
  return material;
}

const numblobs = 10;
const resolution = 64;
const material = getMaterial();
const effect = new MarchingCubes( resolution, material, true, true );
effect.position.set( 0, 0, 0 );
effect.scale.set( 5, 5, 5 );
effect.enableUvs = false;
effect.enableColors = false;
effect.init( resolution );
effect.isolation = 80;
effect.castShadow = true;
effect.receiveShadow = true;
group.add(effect);

scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set(-1,1,1);
directionalLight.castShadow = true;
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, 1 );
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

const loopDuration = 4;
const cameraOffset = new THREE.Vector3();

const points = pointsOnSphere(numblobs);

function updateCubes( object, time, cohesion, strength, subtract ) {
  object.reset();
  // fill the field with some metaballs
  var i, ballx, bally, ballz, subtract, strength;
  for ( i = 0; i < numblobs; i ++ ) {
    ballx = .5 + .35 * points[i].x;
    bally = .5 + .35 * points[i].y;
    ballz = .5 + .35 * points[i].z
    const c = .5 + .5 * Math.cos((cohesion+time + i/numblobs) * Maf.TAU);
    ballx = Maf.mix( .5, ballx, c );
    bally = Maf.mix( .5, bally, c );
    ballz = Maf.mix( .5, ballz, c );
    object.addBall(ballx, bally, ballz, strength, subtract);
  }
}

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  const subtract = 12 - 10 * (.5+.5*Math.cos(t*Maf.TAU));
  const strength = .5;//.5 / ( ( Math.sqrt( numblobs ) - 1 ) / 4 + 1 );

  updateCubes( effect, t, .5 + .5 * Math.sin( t * Maf.TAU ), strength, subtract );
  effect.material.opacity = 1 * time / loopDuration;

  const tt = easings.InOutQuad(t);
  effect.rotation.y = .5*Math.PI;
  effect.rotation.z = tt*Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
