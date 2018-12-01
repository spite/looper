import THREE from '../third_party/three.js';

class InstancedAttributeArray {

  constructor(length, size, dynamic) {
    this.length = length;
    this.size = size;
    this.values = new Float32Array(length * size);
    this.attribute = new THREE.InstancedBufferAttribute(this.values, size);
    this.attribute.setDynamic(dynamic);
  }

  update(count) {
    this.attribute.updateRange = { offset: 0, count: count * this.size };
    this.attribute.needsUpdate = true;
  }
}

class InstancedGeometry {

  constructor(baseGeometry, options = {}) {

    this.options = options;

    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.index = baseGeometry.index;
    this.geometry.addAttribute('position', baseGeometry.getAttribute('position'));
    this.geometry.addAttribute('normal', baseGeometry.getAttribute('normal'));
    if (options.hasUVs) {
      this.geometry.addAttribute('uv', baseGeometry.getAttribute('uv'));
    }

    const MAX_SIZE = options.size || 100000;

    // Dynamic BufferAttribute means the renderer will look up the draw range
    // property, assigned with .updateRange().

    const dynamic = options.dynamic !== undefined ? options.dynamic : true;

    this.positions = new InstancedAttributeArray(MAX_SIZE, 3, dynamic);
    this.geometry.addAttribute('instancePosition', this.positions.attribute);

    this.quaternions = new InstancedAttributeArray(MAX_SIZE, 4, dynamic);
    this.geometry.addAttribute('instanceQuaternion', this.quaternions.attribute);

    this.scales = new InstancedAttributeArray(MAX_SIZE, 3, dynamic);
    this.geometry.addAttribute('instanceScale', this.scales.attribute);

    if (this.options.colors) {
      this.colors = new InstancedAttributeArray(MAX_SIZE, 4, dynamic);
      this.geometry.addAttribute('instanceColor', this.colors.attribute);
    }

    if (this.options.roughness) {
      this.roughness = new InstancedAttributeArray(MAX_SIZE, 1, dynamic);
      this.geometry.addAttribute('instanceRoughness', this.roughness.attribute);
    }

    if (this.options.metalness) {
      this.metalness = new InstancedAttributeArray(MAX_SIZE, 1, dynamic);
      this.geometry.addAttribute('instanceMetalness', this.metalness.attribute);
    }

    this.update(0);
  }

  update(count) {
    this.positions.update(count);
    this.quaternions.update(count);
    this.scales.update(count);
    if (this.options.colors) this.colors.update(count);
    if (this.options.roughness) this.roughness.update(count);
    if (this.options.metalness) this.metalness.update(count);

    this.geometry.maxInstancedCount = count;
  }
}

function getInstancedMeshStandardMaterial(options = {}, instanceOptions = {}) {
  let material;
  if (options.transparent) {
    material = new THREE.MeshPhongMaterial({
      color: options.color || 0xffffff,
      wireframe: options.wireframe || false,
      transparent: true,
      depthWrite: options.depthWrite || false,
      depthTest: options.depthTest || true,
      side: options.side || THREE.FrontSide,
    });
  } else {
    material = new THREE.MeshStandardMaterial({
      color: options.color || 0xffffff,
      map: options.map || null,
      normalMap: options.normalMap || null,
      transparent: false,
      wireframe: options.wireframe || false,
      metalness: options.metalness !== undefined ? options.metalness : .5,
      roughness: options.roughness !== undefined ? options.roughness : .5,
      depthWrite: options.depthWrite || true,
      depthTest: options.depthTest || true,
      side: options.side || THREE.FrontSide,
    });
  }

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec3 instancePosition;
attribute vec4 instanceQuaternion;
attribute vec3 instanceScale;
attribute vec4 instanceColor;
attribute float instanceRoughness;
attribute float instanceMetalness;
varying vec4 VIColor;
varying float VIRoughness;
varying float VIMetalness;
vec3 applyTRS( vec3 position, vec3 translation, vec4 quaternion, vec3 scale ) {
  position *= scale;
  position += 2.0 * cross( quaternion.xyz, cross( quaternion.xyz, position ) + quaternion.w * position );
  return position + translation;
}
${shader.vertexShader}`;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
transformed = applyTRS(position, instancePosition, instanceQuaternion, instanceScale);
VIColor = instanceColor;
VIRoughness = instanceRoughness;
VIMetalness = instanceMetalness;
`);

    shader.vertexShader = shader.vertexShader.replace(
      '#include <defaultnormal_vertex>',
      `#include <defaultnormal_vertex>
transformedNormal = normalMatrix * applyTRS(objectNormal, vec3(0.), instanceQuaternion, vec3(1.));
`);

    shader.fragmentShader = `varying vec4 VIColor;
varying float VIRoughness;
varying float VIMetalness;
${shader.fragmentShader}`;

    if (instanceOptions.colors) {
      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `vec4 diffuseColor = VIColor;`);
    }
  };

  material.onAfterIncludes = function(type, source) {

    if (type === 1) {
      if (instanceOptions.roughness) {
        source = source.replace(
          'float roughnessFactor = roughness;',
          `float roughnessFactor = VIRoughness;`);
      }
      if (instanceOptions.metalness) {
        source = source.replace(
          'float metalnessFactor = metalness;',
          `float metalnessFactor = VIMetalness;`);
      }
    }
    return source;
  }

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
      '#include <begin_vertex>',
      `#include <begin_vertex>
VIColor = instanceColor;
vUv = uv;
`);

    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
mvPosition = modelViewMatrix * vec4(instancePosition,1.) + vec4(instanceScale * position,0.);
gl_Position = projectionMatrix * mvPosition;
`);

    shader.fragmentShader = `varying vec4 VIColor;
varying vec2 vUv;

${shader.fragmentShader}`;

    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `vec4 diffuseColor = VIColor;
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
      '#include <begin_vertex>',
      `#include <begin_vertex>
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
      '#include <project_vertex>',
      `#include <project_vertex>
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