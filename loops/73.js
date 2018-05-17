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
      color: 0xffffff,
      metalness: 0,
      roughness: .125,
      side: THREE.DoubleSide,
    });
    material.flatShading = true;
  }
  material.onBeforeCompile = (shader) => {
    material.uniforms = shader.uniforms;
    shader.uniforms.time = { value: 0 };
    shader.uniforms.t1 = { value: 0 };
    shader.uniforms.t2 = { value: 0 };
    shader.uniforms.scale = { value: 0 };
    shader.vertexShader = `uniform float time;
uniform float t1;
uniform float t2;
uniform float scale;
varying float vNoise;
varying vec2 vUv;

${noise3d}
${turbulence}
${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
        `#include <project_vertex>`,
        `
  float noise1 = 1.-abs(noise3d( position + 2.*t1 ));
  float noise2 = 1.-abs(noise3d( position + 2.*t2 ));
  float noise12 = 1.-abs(noise3d( .5*position + t1 ));
  float noise22 = 1.-abs(noise3d( .5*position + t2 ));
  float displacement = mix(noise1*noise12, noise2*noise22, 1. - time);
  transformed = position + normal * smoothstep(0.,1.,displacement);
  vNoise = displacement;
  vUv = uv;
  #include <project_vertex>`);

    shader.fragmentShader = `uniform float time;
uniform float t1;
uniform float t2;
varying float vNoise;
varying vec2 vUv;

${noise3d}
${shader.fragmentShader}`;

  if (!depth) {
    shader.fragmentShader = shader.fragmentShader.replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `vec4 diffuseColor = vec4( diffuse, opacity );
diffuseColor.rgb *= vec3(.5 + .25 * clamp(vNoise,0.,1.));
`
        );
    }
    return shader;
  }
  return material;
}

const geo = new THREE.IcosahedronBufferGeometry(2., 6);
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

camera.position.set(8, 8, 8);
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
    mesh.material.uniforms.t1.value = t;
    mesh.material.uniforms.t2.value = (t+.5)%1;
    mesh.material.uniforms.scale.value = 1 + .5 * Math.sin(4*t*Maf.TAU);
    mesh.customDepthMaterial.uniforms.time.value = mesh.material.uniforms.time.value;
    mesh.customDepthMaterial.uniforms.t1.value = mesh.material.uniforms.t1.value;
    mesh.customDepthMaterial.uniforms.t2.value = mesh.material.uniforms.t2.value;
    mesh.customDepthMaterial.uniforms.scale.value = mesh.material.uniforms.scale.value;
  }

  const r = .01;
  scene.position.set(
   Maf.randomInRange(-r,r),
   Maf.randomInRange(-r,r),
   Maf.randomInRange(-r,r)
  );
  group.rotation.x = -t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
