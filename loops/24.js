/**
 * Based on https://dribbble.com/shots/1783699-Blocks
 */

import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import perlin from '../third_party/perlin.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const side = .5;
const geo = new THREE.BoxBufferGeometry(side,2,side);

function getMaterial() {
  const material = new THREE.MeshStandardMaterial({color: 0x5186a6, metalness: .1, roughness: .1});
  material.onBeforeCompile = (shader) =>{
    shader.vertexShader = shader.vertexShader.replace(
      `varying vec3 vViewPosition;`,
      `varying vec3 vViewPosition;
  varying vec3 vObjectNormal;`);
    shader.vertexShader = shader.vertexShader.replace(
      `#include <defaultnormal_vertex>`,
      `#include <defaultnormal_vertex>
  vObjectNormal = objectNormal.xyz;`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `varying vec3 vViewPosition;`,
      `varying vec3 vViewPosition;
  varying vec3 vObjectNormal;`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( diffuse, opacity );
      if(abs(vObjectNormal.z)>.5) diffuseColor.rgb += vec3(129.,200.,169.) / 255.;
      if(abs(vObjectNormal.x)>.5) diffuseColor.rgb += vec3(55.,60.,148.) / 255.;`);
  }
  return material;
}

const cubes = [];
const SIZE = 5;
for(let z=-SIZE; z<=SIZE; z+=side) {
  for(let x=-SIZE; x<=SIZE; x+=side) {
    const mesh = new THREE.Mesh(geo, getMaterial());
    mesh.position.set(x,0,z);
    mesh.castShadow = mesh.receiveShadow = true;
    cubes.push({mesh,x,z})
    group.add(mesh);
  }
}
scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-5,5,5);
directionalLight.target.position.set(0,-3,0);
const s = 8;
directionalLight.shadow.camera.top = s;
directionalLight.shadow.camera.right = s;
directionalLight.shadow.camera.bottom = -s;
directionalLight.shadow.camera.left = -s;
directionalLight.shadow.camera.updateProjectionMatrix();
directionalLight.castShadow = true;
scene.add(directionalLight.target);
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight2.position.set(5,5,5);
directionalLight2.target.position.set(0,-3,0);
directionalLight2.shadow.camera.top = s;
directionalLight2.shadow.camera.right = s;
directionalLight2.shadow.camera.bottom = -s;
directionalLight2.shadow.camera.left = -s;
directionalLight2.shadow.camera.updateProjectionMatrix();
directionalLight2.castShadow = true;
scene.add(directionalLight2.target);
scene.add( directionalLight2 );

const ambientLight = new THREE.AmbientLight(0xffffff, .25);
scene.add(ambientLight);

const light = new THREE.HemisphereLight( 0x808080, 0x404040, 1);
scene.add( light );

const target = new THREE.Vector3(0,0,0);
camera.position.set(0,25,15);
camera.lookAt(target);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 4;

function fbm(x,y,z) {
  const tx = perlin.perlin2(x,.5);
  const ty = perlin.perlin2(y,.5);
  const tz = perlin.perlin2(z,.5);
  const n1 = perlin.perlin3(tx,ty,tz);
  const n2 = perlin.perlin3(2*tx,2*ty,2*tz);
  const n3 = perlin.perlin3(4*tx,4*ty,4*tz);
  return (n1+n2+n3)/3;
}

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  const t2 = (time + .5 * loopDuration ) % loopDuration;
  const s = .1;
  const adjust1 = Maf.parabola(time/loopDuration,4);
  const adjust2 = Maf.parabola(t2/loopDuration,4);
  const f = easings.InOutQuint(.5 + .5 * Math.cos(time*2*Math.PI/loopDuration));

  const ratio = 1/4 + f * 4;
  cubes.forEach( c => {
    const x = Math.round( c.x * ratio ) / ratio;
    const z = Math.round( c.z * ratio ) / ratio;
    const scale1 = adjust1 * fbm(.11+s*x,.12+s*z, 2.75*time);
    const scale2 = adjust2 * fbm(.21+s*x,.13+s*z, 2.5*t2);
    const scale = Math.exp(2.5*(scale1+scale2));
    c.mesh.scale.y = scale;
    const a = (z===0&&x===0)?0:Math.atan2(z,x);
    c.mesh.material.color.setHSL(a/(2*Math.PI),.5,.5);
    c.mesh.position.y = scale;//Maf.mix( -7 + 1 * scale, 7 - 1 * scale, 1-f);
  })

  //target.y = (f * .15 - .075);
  //camera.lookAt(target);

  group.rotation.y = 2 * Math.PI * easings.Linear( time / loopDuration);
  //group.rotation.x = 2 * Math.PI * easings.Linear( time / loopDuration);

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
