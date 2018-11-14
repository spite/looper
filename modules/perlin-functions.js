import noise from '../third_party/perlin.js';

function squareTurbulence(v) {
  return Math.pow(v, 2.);
}

function ridgedTurbulence(v) {
  return 1. - Math.abs(v);
}

function gaussianTurbulence(v) {
  return 1. - Math.exp(-Math.pow(v, 2));
}

function fbm(x, y, z) {
  let value = 0.;
  let amplitude = 1.;
  for (let i = 0; i < 8; i++) {
    value += amplitude * Math.abs(noise.perlin3(x, y, z));
    x *= 2.;
    y *= 2.;
    z *= 2.;
    amplitude *= .5;
  }
  return 2 * squareTurbulence(.3 + value) - 1;
}

function turbulence(x, y, z) {

  let w = 100.0;
  let t = -.5;

  for (let f = 1.0; f <= 10.0; f++) {
    let power = Math.pow(2.0, f);
    t += Math.abs(noise.perlin3(x * power, y * power, z * power));
  }

  return 2 * t;

}

export { turbulence, fbm, gaussianTurbulence, ridgedTurbulence, squareTurbulence, noise }