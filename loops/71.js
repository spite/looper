import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise3d from '../shaders/noise3d.js';

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
      roughness: .5,
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
varying vec3 vPos;
varying vec2 vUv;

${noise3d}
${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
        `#include <project_vertex>`,
        `
  float nn1 = noise3d(.1*position + vec3(4.*t1,0.,2.*t1)) + noise3d(.5*position + vec3(4.*t1,2.*t1,0.));
  float nn2 = noise3d(.1*position + vec3(4.*t2,0.,2.*t2)) + noise3d(.5*position + vec3(4.*t2,2.*t2,0.));
  float n = mix(nn1,nn2,1.-time);
  transformed = position + scale  * normal * (.5 + .5 * n);
  vPos = position + vec3(5.*position.y,0.,0.);
  vUv = uv;
  #include <project_vertex>`);

    shader.fragmentShader = `uniform float time;
uniform float t1;
uniform float t2;
varying vec3 vPos;
varying vec2 vUv;

${noise3d}
${shader.fragmentShader}`;

  if (!depth) {
    shader.fragmentShader = shader.fragmentShader.replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `vec4 diffuseColor = vec4( diffuse, opacity );
vec3 p = vec3(
  noise3d(.5*vPos.zxy + vec3(time,0.,0.)),
  noise3d(.5*vPos.xyz + vec3(time,0.,0.)),
  noise3d(.5*vPos.yzx + vec3(time,0.,0.))
);
float nn1 = noise3d(p + vec3(4.*t1,0.,t1)) + noise3d(p + vec3(t1,t1,0.));
float nn2 = noise3d(p + vec3(t2,0.,4.*t2)) + noise3d(p + vec3(t2,t2,0.));
float n = .5+.5*mix(nn1,nn2,1.-time);
diffuseColor.rgb = vec3(1.-smoothstep(.3,.6,n));
if(n>.5) {
  discard;
}
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

const loopDuration = 3;

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

  group.rotation.y = -t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
