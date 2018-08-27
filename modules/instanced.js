import THREE from '../third_party/three.js';

class InstancedGeometry {

  constructor(baseGeometry) {
    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.index = baseGeometry.index;
    this.geometry.addAttribute(
      'position', baseGeometry.getAttribute('position'));
    this.geometry.addAttribute('normal', baseGeometry.getAttribute('normal'));
    this.geometry.addAttribute('uv', baseGeometry.getAttribute('uv'));

    const MAX_SIZE = 100000;

    this.posValues = new Float32Array(MAX_SIZE * 3);
    this.posAttribute = new THREE.InstancedBufferAttribute(this.posValues, 3);
    // Dynamic BufferAttribute means the renderer will look up the draw range
    // property, assigned with .updateRange().
    this.posAttribute.setDynamic(true);
    this.geometry.addAttribute(
      'instancePosition', this.posAttribute);

    this.quatValues = new Float32Array(MAX_SIZE * 4);
    this.quatAttribute = new THREE.InstancedBufferAttribute(this.quatValues, 4);
    this.quatAttribute.setDynamic(true);
    this.geometry.addAttribute('instanceQuaternion', this.quatAttribute);

    this.scaleValues = new Float32Array(MAX_SIZE * 3);
    this.scaleAttribute =
      new THREE.InstancedBufferAttribute(this.scaleValues, 3);
    this.scaleAttribute.setDynamic(true);
    this.geometry.addAttribute('instanceScale', this.scaleAttribute);

    this.colorValues = new Float32Array(MAX_SIZE * 4);
    this.colorAttribute =
      new THREE.InstancedBufferAttribute(this.colorValues, 4);
    this.colorAttribute.setDynamic(true);
    this.geometry.addAttribute('instanceColor', this.colorAttribute);

    this.update(0);
  }

  update(count) {
    this.posAttribute.updateRange = { offset: 0, count: count * 3 };
    this.posAttribute.needsUpdate = true;
    this.quatAttribute.updateRange = { offset: 0, count: count * 4 };
    this.quatAttribute.needsUpdate = true;
    this.scaleAttribute.updateRange = { offset: 0, count: count * 3 };
    this.scaleAttribute.needsUpdate = true;
    this.colorAttribute.updateRange = { offset: 0, count: count * 4 };
    this.colorAttribute.needsUpdate = true;

    this.geometry.maxInstancedCount = count;
  }
}

function getInstancedMeshStandardMaterial(transparent = false) {
  let material;
  if (transparent) {
    material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      wireframe: !true,
      transparent: true,
      depthWrite: false,
    });
  } else {
    material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: .1,
      roughness: .2,
    });
  }

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec3 instancePosition;
attribute vec4 instanceQuaternion;
attribute vec3 instanceScale;
attribute vec4 instanceColor;
varying vec4 VIColor;
vec3 applyTRS( vec3 position, vec3 translation, vec4 quaternion, vec3 scale ) {
  position *= scale;
  position += 2.0 * cross( quaternion.xyz, cross( quaternion.xyz, position ) + quaternion.w * position );
  return position + translation;
}
${shader.vertexShader}`;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>', `#include <begin_vertex>
transformed = applyTRS(position, instancePosition, instanceQuaternion, instanceScale);
VIColor = instanceColor;
`);

    shader.vertexShader = shader.vertexShader.replace(
      '#include <defaultnormal_vertex>', `#include <defaultnormal_vertex>
transformedNormal = normalMatrix * applyTRS(objectNormal, vec3(0.), instanceQuaternion, vec3(1.));
`);

    shader.fragmentShader = `varying vec4 VIColor;
${shader.fragmentShader}`;

    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `vec4 diffuseColor = vec4(diffuse,opacity)*VIColor;`);
  };
  return material;
}

function getInstancedParticleMaterial(transparent = false) {
  let material;
  if (transparent) {
    material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      depthWrite: false,
    });
  } else {
    material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
  }

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec3 instancePosition;
attribute vec3 instanceScale;
attribute vec4 instanceColor;
varying vec4 VIColor;
varying vec2 vUv;
${shader.vertexShader}`;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>', `#include <begin_vertex>
VIColor = instanceColor;
vUv = uv;
`);

    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>', `#include <project_vertex>
mvPosition = modelViewMatrix * vec4(instancePosition,1.) + vec4(instanceScale * position,0.);
gl_Position = projectionMatrix * mvPosition;
`);

    shader.fragmentShader = `varying vec4 VIColor;
varying vec2 vUv;

${shader.fragmentShader}`;

    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `vec4 diffuseColor = vec4(diffuse,opacity)*VIColor;
float l = length(vUv);
if (l>1./4.) { discard; }`);
  };
  return material;
}

function getInstancedDepthMaterial() {
  const material = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec3 instancePosition;
attribute vec4 instanceQuaternion;
attribute vec3 instanceScale;
vec3 applyTRS( vec3 position, vec3 translation, vec4 quaternion, vec3 scale ) {
  position *= scale;
  position += 2.0 * cross( quaternion.xyz, cross( quaternion.xyz, position ) + quaternion.w * position );
  return position + translation;
}
${shader.vertexShader}`;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>', `#include <begin_vertex>
transformed = applyTRS(position, instancePosition, instanceQuaternion, instanceScale);
`);
  };
  return material;
}

function getInstancedParticleDepthMaterial() {
  const material = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec3 instancePosition;
attribute vec4 instanceQuaternion;
attribute vec3 instanceScale;
varying vec2 vUv;

${shader.vertexShader}`;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>', `#include <project_vertex>
mvPosition = modelViewMatrix * vec4(instancePosition,1.) + vec4(instanceScale * position,0.);
gl_Position = projectionMatrix * mvPosition;
vUv = uv;
`);

    shader.fragmentShader = `varying vec2 vUv;

    ${shader.fragmentShader}`;

    shader.fragmentShader =
      shader.fragmentShader.replace('void main() {', `void main() {;
    float l = length(vUv);
    if (l>1./4.) { discard; }`);
  };
  return material;
}

export { InstancedGeometry, getInstancedMeshStandardMaterial, getInstancedDepthMaterial, getInstancedParticleMaterial, getInstancedParticleDepthMaterial }