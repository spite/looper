import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';

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

    shader.fragmentShader = `
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

float pattern(vec2 uv) {
  return smoothstep( .15, .25, .5 + .5 * sin(uv.y*40.));
}
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( diffuse, opacity );
  float v = pattern(vUv);
  float modifiedRoughness = .25 * v;
  float modifiedMetalness = .1*v;
  diffuseColor *= .5 + .5 * v;
  float e = .01;
  float p1 = pattern(vUv+vec2(e,0.));
  float p2 = pattern(vUv+vec2(0.,e));
  vec2 stripOffset = -vec2(v-p1, v-p2);
  `);

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

const objects = [];
for (let i=0; i<4; i++) {
  objects[i] = [];
  for (let j=0; j<10; j++) {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(.5,4),
      getMaterial()
    );
    mesh.material.color.setHSL(j/10,.5,.5);
    mesh.receiveShadow = mesh.castShadow = true;
    mesh.rotation.x = Math.PI / 2;
    group.add(mesh);
    objects[i].push(mesh);
  }
}

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

camera.position.set(4,-4,8);
camera.lookAt(group.position);
renderer.setClearColor(0x101010,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;
  const t2 = easings.InOutQuad(t);

  objects.forEach( (obj,i) => {
    obj.forEach( (o,j) => {
      const tt = ( t + i / objects.length ) % 1;
      const f = j / obj.length;
      const a = f*Maf.TAU - tt;
      const r = ((tt/obj.length)%(1/obj.length)-tt) * 3;
      const x = r * Math.cos(a);
      const y = r * Math.sin(a);
      const z = .1*Maf.parabola(tt,1);
      const scale = Maf.parabola(tt,4);
      o.position.set(x,y,z);
      o.scale.setScalar(scale);
    });
  });

  group.rotation.z = t * Maf.TAU;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
