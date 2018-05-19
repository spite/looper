import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise3d from '../shaders/noise3d.js';
import turbulence from '../shaders/turbulence.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const objects = [];

function getMaterial(depth) {
  let material;
  if (depth) {
    material = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      side: THREE.DoubleSide
    });
  } else {
    material = new THREE.MeshStandardMaterial({
      wireframe: !true,
      color: 0xb70000,
      metalness: 0,
      roughness: .125,
      side: THREE.DoubleSide,
    });
//    material.flatShading = true;
  }
  material.onBeforeCompile = (shader) => {
    material.uniforms = shader.uniforms;
    shader.uniforms.time = { value: 0 };
    shader.uniforms.scale = { value: 0 };
    shader.vertexShader = `uniform float time;
uniform float scale;
varying vec3 vPos;

${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
        `#include <project_vertex>`,
        `
  vPos = .5*position;
  #include <project_vertex>`);

  if (!depth) {
    shader.fragmentShader = `uniform float time;
varying float vNoise;
varying vec3 vPos;
uniform float scale;

${noise3d}
${shader.fragmentShader}`;

    shader.fragmentShader = shader.fragmentShader.replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `vec4 diffuseColor = vec4( diffuse, opacity );
float s2 = .1 + .9 * scale;
float n = .5 + .5 * noise3d(vec3(
  noise3d(vPos*vec3(1.5,1.,1.) + vec3(time,0.,0.)),
  noise3d(vPos*vec3(1.,1.2,1.) + vec3(0.,time,0.)),
  noise3d(vPos*vec3(1.,1.,1.3) + vec3(0.,0.,time))
));
float s = 1. + .1 * scale;
float c = .1 + .9 * smoothstep( .4,.6, n);
diffuseColor.rgb *= vec3(clamp(smoothstep(.1*scale,.2*scale,(n-scale)),0.,1.));
float modifiedRoughness = .5*(n-scale);
if( n<scale) { discard;}
`);

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      roughnessFactor = modifiedRoughness;`
    );

    shader.fragmentShader = `#extension GL_OES_standard_derivatives : enable
    ${shader.fragmentShader}`;

    } else {
       shader.fragmentShader = `uniform float time;
varying float vNoise;
varying vec3 vPos;
uniform float scale;

${noise3d}
${shader.fragmentShader}`;

    shader.fragmentShader = shader.fragmentShader.replace(
        `void main() {`,
        `void main() {
float s2 = .1 + .9 * scale;
float n = .5 + .5 * noise3d(vec3(
  noise3d(vPos*vec3(1.5,1.,1.) + vec3(time,0.,0.)),
  noise3d(vPos*vec3(1.,1.2,1.) + vec3(0.,time,0.)),
  noise3d(vPos*vec3(1.,1.,1.3) + vec3(0.,0.,time))
));
if( n<scale) { discard;}
`);
    }
    return shader;
  }
  return material;
}

const geo = new THREE.TorusKnotBufferGeometry(2.5, .75, 200, 36);
const mat = getMaterial();
const mesh = new THREE.Mesh(geo, mat);
mesh.customDepthMaterial = getMaterial(true);
mesh.castShadow = mesh.receiveShadow = true;
group.add(mesh);

scene.add(group);

const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
directionalLight.position.set(-1, 1, 1);
directionalLight.castShadow = true;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5);
directionalLight2.position.set(1, 2, 1);
directionalLight2.castShadow = true;
scene.add(directionalLight2);

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight(0xcefeff, 0xb3eaf0, .5);
scene.add(light);

camera.position.set(0, 0, 17);
camera.lookAt(scene.position);
renderer.setClearColor(0x202020, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  if (mesh.material.uniforms) {
    mesh.material.uniforms.time.value = Maf.parabola(t,1);
    mesh.material.uniforms.scale.value = easings.InQuad(.5 + .5 * Math.sin(t*Maf.TAU));
    mesh.customDepthMaterial.uniforms.time.value = mesh.material.uniforms.time.value;
    mesh.customDepthMaterial.uniforms.scale.value = mesh.material.uniforms.scale.value;
  }

  const r = .01;
  scene.position.set(
   Maf.randomInRange(-r,r),
   Maf.randomInRange(-r,r),
   Maf.randomInRange(-r,r)
  );
  mesh.rotation.y = -t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
