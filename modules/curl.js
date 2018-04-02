import THREE from '../third_party/three.js';
import noise from '../third_party/perlin.js';

const noiseFunc0 = ( v ) => {
  const s  = noise.simplex3( v.x, v.y, v.z );
  const s1 = noise.simplex3( v.y - 19.1, v.z + 33.4, v.x + 47.2 );
  const s2 = noise.simplex3( v.z + 74.2, v.x - 124.5, v.y + 99.4 );
  return new THREE.Vector3( s, s1, s2 );
}

const generateNoiseFunction = () => {
  const a = Maf.randomInRange( -100, 100 );
  const b = Maf.randomInRange( -100, 100 );
  const c = Maf.randomInRange( -100, 100 );
  const d = Maf.randomInRange( -100, 100 );
  const e = Maf.randomInRange( -100, 100 );
  const f = Maf.randomInRange( -100, 100 );
  return function( v ) {
    const s  = noise.simplex3( v.x, v.y, v.z );
    const s1 = noise.simplex3( v.y + a, v.z + b, v.x + c );
    const s2 = noise.simplex3( v.z + c, v.x + d, v.y + f );
    return new THREE.Vector3( s , s1 , s2 );
  }
}

const noiseFunc = generateNoiseFunction();

const e = .1;
const dx = new THREE.Vector3( e   , 0.0 , 0.0 );
const dy = new THREE.Vector3( 0.0 , e   , 0.0 );
const dz = new THREE.Vector3( 0.0 , 0.0 , e   );
const tmp = new THREE.Vector3();
const res = new THREE.Vector3();

const curl = ( p ) => {
  const p_x0 = noiseFunc( tmp.copy( p ).sub( dx ) );
  const p_x1 = noiseFunc( tmp.copy( p ).add( dx ) );
  const p_y0 = noiseFunc( tmp.copy( p ).sub( dy ) );
  const p_y1 = noiseFunc( tmp.copy( p ).add( dy ) );
  const p_z0 = noiseFunc( tmp.copy( p ).sub( dz ) );
  const p_z1 = noiseFunc( tmp.copy( p ).add( dz ) );
  const x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
  const y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
  const z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
  const divisor = 1.0 / ( 2.0 * e );
  res.set( x, y, z ).multiplyScalar( divisor ).normalize();
  return res;
}

export {curl, generateNoiseFunction};
