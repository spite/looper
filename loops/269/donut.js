import THREE from '../../third_party/three.js';
import noise from '../../third_party/perlin.js';
import easings from '../../modules/easings.js';

function bump(x, y, z, seed) {
  return noise.perlin3(x + seed, y, z);
}

function bumpGeometry(geometry, amount, seed) {
  const p = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const positions = geometry.attributes.position.array;
  const normals = geometry.attributes.normal.array;
  for (let j = 0; j < positions.length; j += 3) {
    p.set(positions[j + 0], positions[j + 1], positions[j + 2]);
    normal.set(positions[j + 0], positions[j + 1], positions[j + 2]);
    const n = amount * bump(p.x, p.y, p.z, seed);
    normal.multiplyScalar(1 + .1 * n);
    p.add(normal);
    positions[j + 0] = p.x;
    positions[j + 1] = p.y;
    positions[j + 2] = p.z;
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createDonutGeometry(outerRadius, innerRadius, seed) {
  const geometry = new THREE.TorusBufferGeometry(outerRadius, innerRadius, 36, 50);
  return geometry;
}

function outerBorder(a, seed, spread) {
  const f = 3;
  const r = .5;
  return Maf.PI / 8 + spread * noise.perlin2(r * Math.cos(f * a) + seed, r * Math.sin(f * a));
}

function innerBorder(a, seed, spread) {
  return Maf.PI - Maf.PI / 8 + spread * .5 * noise.perlin2(1 * Math.cos(a) + seed, 1 * Math.sin(a));
}

function createFrostingGeometry(outerRadius, innerRadius, seed) {

  const geometry = new THREE.PlaneBufferGeometry(1, 1, 25, 50);

  const base = new THREE.Vector3();
  const p = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const spread = .5;

  const positions = geometry.attributes.position.array;
  for (let j = 0; j < positions.length; j += 3) {
    const x = positions[j + 0];
    const y = positions[j + 1];
    const z = positions[j + 2];
    const a = Maf.map(-.5, .5, 0, Maf.TAU, y);
    const r = outerRadius;
    base.set(Math.cos(a), Math.sin(a), 0).multiplyScalar(r);
    const a2 = Maf.map(.5, -.5, outerBorder(a, seed, spread), innerBorder(a, seed, spread), x);
    const s = 1.01 + .1 * (easings.InOutQuad(Maf.parabola(Maf.map(.5, -.5, 0, 1, x), .1)));
    p.set(Math.cos(a2), 0, Math.sin(a2)).multiplyScalar(s * innerRadius);
    m.makeRotationZ(a);
    p.applyMatrix4(m);
    p.add(base);
    positions[j + 0] = p.x;
    positions[j + 1] = p.y;
    positions[j + 2] = p.z;
  }
  geometry.computeVertexNormals();
  return geometry;
}

export { createDonutGeometry, createFrostingGeometry, bumpGeometry };