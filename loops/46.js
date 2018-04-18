import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {MarchingCubes} from '../third_party/THREE.MarchingCubes.js';
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

float pattern(vec3 pos) {
  float threshold = .8 * cos(opacity*TAU);
  if (pos.x<threshold) return .2; else return .9;
}
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( diffuse, opacity );
  float e = .0001;
  float strip = pattern(pos);
  vec2 stripOffset = vec2(
    pattern(pos+vec3(e,0.,0.))-strip,
    pattern(pos+vec3(0.,e,0.))-strip
  );
  float modifiedRoughness = strip;
  diffuseColor.rgb = vec3(.5*strip);`);

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

const numblobs = 10;
const resolution = 64;
const material = getMaterial();
const effect = new MarchingCubes( resolution, material, true, true );
effect.position.set( 0, 0, 0 );
effect.scale.set( 5, 5, 5 );
effect.enableUvs = false;
effect.enableColors = false;
effect.init( resolution );
effect.isolation = 20;
group.add(effect);

scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set(-1,1,1);
const r = 50;
directionalLight.shadow.camera.near = .001;
directionalLight.shadow.camera.far = 1000;
directionalLight.shadow.camera.left = -r;
directionalLight.shadow.camera.right = r;
directionalLight.shadow.camera.top = r;
directionalLight.shadow.camera.bottom = -r;
directionalLight.shadow.camera.updateProjectionMatrix();
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight2.position.set(1,2,1);
directionalLight2.shadow.camera.left = -r;
directionalLight2.shadow.camera.right = r;
directionalLight2.shadow.camera.top = r;
directionalLight2.shadow.camera.bottom = -r;
directionalLight2.shadow.camera.updateProjectionMatrix();
scene.add( directionalLight2 );

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight( 0xcefeff, 0xb3eaf0, .5 );
scene.add( light );

camera.zoom = 1.;
camera.fov = 90;
camera.updateProjectionMatrix();
camera.position.set(5,0,0);
camera.lookAt(new THREE.Vector3(0,0,0));
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;
const cameraOffset = new THREE.Vector3();

const points = [];
for (let j=0; j<numblobs; j++) {
  points.push({
    pos: new THREE.Vector3(),
    origin: new THREE.Vector3(
      Maf.randomInRange(-.25,.25),
      Maf.randomInRange(-.25,.25),
      Maf.randomInRange(-.25,.25),
    ),
    offset: Maf.randomInRange(0,Maf.TAU),
    multiplier: Math.floor(Maf.randomInRange(1,3))
  });
}

function updateCubes( object, cohesion, strength, subtract ) {
  object.reset();
  object.cage();

  var i, ballx, bally, ballz, subtract, strength;
  for ( i = 0; i < points.length; i ++ ) {
    ballx = .5 + .5 * points[i].pos.x;
    bally = .5 + .5 * points[i].pos.y;
    ballz = .5 + .5 * points[i].pos.z
    object.addBall(ballx, bally, ballz, strength, subtract);
  }

}

let added = false;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  const subtract = 12 - 10 * (.5+.5*Math.cos(t*Maf.TAU));
  const strength = .5 / ( ( Math.sqrt( numblobs ) - 1 ) / 4 + 1 );

  effect.isolation = 40 + 40 * Maf.parabola(easings.InOutQuint(t),4);

  points.forEach( p => {
    p.pos.x = p.origin.x;
    p.pos.y = 1 * Math.cos(t*Maf.TAU *p.multiplier+ p.offset);
    p.pos.z = p.origin.z;
  });

  updateCubes( effect, .5 + .5 * Math.sin( t * Maf.PI ), strength, subtract );
  effect.material.opacity = 1 * time / loopDuration;

  effect.rotation.y = t*Maf.TAU;
  effect.rotation.z = -Maf.PI/4 + Maf.parabola(t,4)*Maf.PI/2;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
