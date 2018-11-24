import THREE from '../../third_party/three.js';
import noise from '../../third_party/perlin.js';

function createCrystal(number, min, max, minOffset, maxOffset) {

  const mScale = new THREE.Matrix4();
  const mTrans = new THREE.Matrix4();
  const mRot = new THREE.Matrix4();
  const m = new THREE.Matrix4();
  const euler = new THREE.Euler();
  const geometry = new THREE.IcosahedronBufferGeometry(1, 1);
  const center = new THREE.Vector3(0, 0, 0);

  var c = geometry.attributes.position.count;
  var finalGeometry = new THREE.BufferGeometry();
  finalGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(c * 3 * number), 3));
  finalGeometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(c * 3 * number), 3));
  var up = new THREE.Vector3(0, 1, 0);
  for (var j = 0; j < number; j++) {
    var g = geometry.clone();
    var sx = Maf.randomInRange(.1, 1);
    var sy = Maf.randomInRange(.1, 1);
    var sz = Maf.randomInRange(min, min + max)
    mScale.makeScale(.5 * sx, .5 * sy, .5 * sz);
    g.applyMatrix(mScale);
    g.computeBoundingBox();
    var z = g.boundingBox.max.z;
    var offset = Maf.randomInRange(minOffset, maxOffset);
    mTrans.identity();
    mTrans.makeTranslation(0, 0, z * offset);
    g.applyMatrix(mTrans);
    mRot.identity();
    mTrans.identity();
    euler.set(
      Maf.randomInRange(0, 2 * Math.PI),
      Maf.randomInRange(0, 2 * Math.PI),
      Maf.randomInRange(0, 2 * Math.PI)
    );
    mRot.makeRotationFromEuler(euler);
    var d = Math.min(sx, sy);
    var p = new THREE.Vector3(Maf.randomInRange(-d, d), Maf.randomInRange(-d, d), Maf.randomInRange(-d, d));
    m.lookAt(center, p, up);
    g.applyMatrix(m);
    finalGeometry.merge(g, j * c);
  }
  var r = .25;
  var s = 10;
  var d = finalGeometry.attributes.position.array;
  for (var j = 0; j < d.length; j += 3) {
    var a = r * noise.perlin3(s * d[j], s * d[j + 1], s * d[j + 2]);
    var b = r * noise.perlin3(2 * s * d[j], 2 * s * d[j + 1], 2 * s * d[j + 2]);
    var dir = new THREE.Vector3(
      Math.sin(a * Math.PI) * Math.cos(b * 2 * Math.PI),
      Math.sin(a * Math.PI) * Math.sin(b * 2 * Math.PI),
      Math.cos(a * Math.PI)
    );
    dir.normalize();
    dir.multiplyScalar(r);
    d[j] += dir.x;
    d[j + 1] += dir.y;
    d[j + 2] += dir.z;
  }
  return finalGeometry;
}

export { createCrystal }