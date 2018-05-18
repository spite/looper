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
      color: 0xff00ff,
      metalness: 0,
      roughness: .125,
      side: THREE.DoubleSide,
    });
//    material.flatShading = true;
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
varying vec3 vPos;
varying vec2 vUv;
varying vec3 vN;

${noise3d}

float distort(vec3 position) {
  float noise1 = 1.-abs(noise3d( .5*scale*position + 2.*t1 ));
  float noise2 = 1.-abs(noise3d( .5*scale*position + 2.*t2 ));
  float noise12 = 1.-abs(noise3d( .25*scale*position + 2.* t1 ));
  float noise22 = 1.-abs(noise3d( .25*scale*position + 2.*t2 ));
  return (1.-mix(1.2*noise1*noise12, 1.2*noise2*noise22, 1. - time));
}

${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
        `#include <project_vertex>`,
        `
  vNoise = distort(position);
  transformed = position + normal * scale*smoothstep(0.,1.,vNoise);
  vPos = transformed;
  vUv = uv;
  float epsilon = .00001;
  vec3 px = position + vec3(epsilon,0.,0.);
  vec3 dx = px + normal * scale*smoothstep(0.,1.,distort(px));
  vec3 py = position + vec3(0.,epsilon,0.);
  vec3 dy = py + normal * scale*smoothstep(0.,1.,distort(py));
  vec3 v1 = transformed - dx;
  vec3 v2 = transformed - dy;
  vN = normalMatrix * normalize(cross(v1,v2));
  #include <project_vertex>`);

  if (!depth) {
    shader.fragmentShader = `uniform float time;
uniform float t1;
uniform float t2;
varying float vNoise;
varying vec3 vPos;
varying vec2 vUv;
varying vec3 vN;

${noise3d}
${shader.fragmentShader}`;

    shader.fragmentShader = shader.fragmentShader.replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `vec4 diffuseColor = vec4( diffuse, opacity );
float n = .5 + .5 * noise3d(vec3(
  noise3d(vPos*vec3(1.5,1.,1.)),
  noise3d(vPos*vec3(1.,1.2,1.)),
  noise3d(vPos*vec3(1.,1.,1.3))
));
float c = .1 + .9 * smoothstep( .4,.6, n);
float c2 = smoothstep(0.2,.3,n);
diffuseColor.rgb *= vec3(.2 + .8 * clamp(vNoise,0.,1.)) * vec3(.2+.8*c,.2+.8*c,0.);
float modifiedRoughness = .5 * n;
`);

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment>',
      `#include <normal_fragment>
      normal = normalize(vN);`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      roughnessFactor = modifiedRoughness;`
    );

    shader.fragmentShader = `#extension GL_OES_standard_derivatives : enable
    ${shader.fragmentShader}`;

    }
    return shader;
  }
  return material;
}

const geo = new THREE.IcosahedronBufferGeometry(2., 5);
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
    mesh.material.uniforms.scale.value = 1 + .1 * Math.sin(4*t*Maf.TAU);
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
  group.rotation.z = -t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
