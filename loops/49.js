import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {MarchingCubes} from '../third_party/THREE.MarchingCubes.js';
import Maf from '../modules/maf.js';
import noise from '../third_party/perlin.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

function getMaterial() {
  const material = new THREE.MeshStandardMaterial({color: 0x5186a6, metalness: .1, roughness: .1});
  material.onBeforeCompile = (shader) =>{
    shader.vertexShader = shader.vertexShader.replace(
      `varying vec3 vViewPosition;`,
      `varying vec3 vViewPosition;
  varying vec3 pos;
  varying vec2 vUv;`);
    shader.vertexShader = shader.vertexShader.replace(
      `#include <defaultnormal_vertex>`,
      `#include <defaultnormal_vertex>
  pos = position.xyz;
  vUv = pos.xy;`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `varying vec3 vViewPosition;`,
      `varying vec3 vViewPosition;
  varying vec3 pos;
  varying vec2 vUv;

#define M_PI 3.1415926535897932384626433832795
#define M_TAU 2.*M_PI

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

float pattern(vec3 pos){
  float r = sqrt(dot(pos,pos));
  float theta = acos(pos.z/r);
  float phi = atan(pos.y,pos.x);
  return smoothstep(.3,.7,.5 + .5 *cos(20.*(theta)+1.*phi + 10.*opacity*M_TAU));
}
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( diffuse, opacity );
      float strip = pattern(pos);
      float stripOffset = pattern(pos+vec3(0.,.0001,0.))-strip;
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
      normal = perturbNormalArb( -vViewPosition, normal, vec2( 0., -stripOffset ) );`
    );

    shader.fragmentShader = `#extension GL_OES_standard_derivatives : enable
    ${shader.fragmentShader}`;

  }
  return material;
}

const resolution = 64;
const material = getMaterial();
const effect = new MarchingCubes( resolution, material, true, true );
effect.position.set( 0, 0, 0 );
effect.enableUvs = false;
effect.enableColors = false;
effect.init( resolution );
effect.isolation = 20;

const mesh = new THREE.Mesh(effect.generateGeometry(), getMaterial());
mesh.scale.set( 5, 5, 5 );
mesh.castShadow = mesh.receiveShadow = true;
group.add(mesh);

scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set(-1,1,1);
const r = 7;
directionalLight.shadow.camera.near = .001;
directionalLight.shadow.camera.far = 10;
directionalLight.shadow.camera.left = -r;
directionalLight.shadow.camera.right = r;
directionalLight.shadow.camera.top = r;
directionalLight.shadow.camera.bottom = -r;
directionalLight.shadow.camera.updateProjectionMatrix();
directionalLight.castShadow = true;
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight2.position.set(1,2,1);
directionalLight2.shadow.camera.near = .001;
directionalLight2.shadow.camera.far = 10;
directionalLight2.shadow.camera.left = -r;
directionalLight2.shadow.camera.right = r;
directionalLight2.shadow.camera.top = r;
directionalLight2.shadow.camera.bottom = -r;
directionalLight2.shadow.camera.updateProjectionMatrix();
directionalLight2.castShadow = true;
scene.add( directionalLight2 );

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight( 0xcefeff, 0xb3eaf0, .5 );
scene.add( light );

camera.zoom = 1.;
camera.fov = 90;
camera.updateProjectionMatrix();
camera.position.set(0,0,6);
camera.lookAt(new THREE.Vector3(0,0,0));
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 8;
const cameraOffset = new THREE.Vector3();

const tmpVector = new THREE.Vector3();

const numBlobs = 20;
const blobs = [];
for (let j=0; j<numBlobs; j++) {
  blobs.push({
    theta: Maf.randomInRange(0,Maf.PI),
    phi: Maf.randomInRange(0,Maf.TAU),
    offset: Maf.randomInRange(0,Maf.TAU),
  })
}

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  effect.isolation = 500;
  effect.reset();

  const radius = .35;
  for (const blob of blobs) {
    const r = radius * Math.cos(t*Maf.TAU+blob.offset);
    tmpVector.x = r * Math.sin(blob.theta) * Math.cos(blob.phi);
    tmpVector.y = r * Math.sin(blob.theta) * Math.sin(blob.phi);
    tmpVector.z = r * Math.cos(blob.theta);
    const s = 3.;
    const offset = Math.cos(t*Maf.TAU) * s;
    const strength = 2;//.1 + 4 * (.5 + .5 * noise.perlin3(s*tmpVector.x + offset, s*tmpVector.y + .5 * offset, s*tmpVector.z + .4 * offset));
    const subtract = 10 + 20 * (.5 + .5 * noise.perlin3(s*tmpVector.x + 1.2*offset, s*tmpVector.y + .8 * offset, s*tmpVector.z + .9 * offset));
    effect.addBall(tmpVector.x+.5, tmpVector.y+.5, tmpVector.z+.5, strength, subtract);
  }

  mesh.geometry.dispose();
  mesh.geometry = effect.generateGeometry();

  mesh.material.opacity = 1 * time / loopDuration;
  mesh.rotation.z = t*Maf.TAU;
  mesh.rotation.x = t*Maf.TAU;

  const jitter = .01;
  directionalLight.position.set(
    1+Maf.randomInRange(-jitter,jitter),
    1+Maf.randomInRange(-jitter,jitter),
    1+Maf.randomInRange(-jitter,jitter),
  );
  directionalLight2.position.set(
    1+Maf.randomInRange(-jitter,jitter),
    2+Maf.randomInRange(-jitter,jitter),
    1+Maf.randomInRange(-jitter,jitter),
  );
  camera.position.set(
    0+Maf.randomInRange(-jitter,jitter),
    0+Maf.randomInRange(-jitter,jitter),
    6.5+Maf.randomInRange(-jitter,jitter),
  );

  renderer.render(scene, camera);

}

export { draw, loopDuration, canvas };
