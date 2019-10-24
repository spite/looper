import Maf from './maf.js';

class RabinovichFabrikantAttractor {

  constructor() {
    this.alpha = 1.1;
    this.gamma = .87;
    this.x = -1;
    this.y = 0;
    this.z = .5;
    this.h = .002;
  }

  generatePoint(x, y, z) {
    var nx = y * (z - 1 + x * x) + this.gamma * x;
    var ny = x * (3 * z + 1 - x * x) + this.gamma * y;
    var nz = -2 * z * (this.alpha + x * y);
    x += this.h * nx;
    y += this.h * ny;
    z += this.h * nz;
    return { x: x, y: y, z: z }
  }

  randomize() {
    this.alpha = Maf.randomInRange(.1, 1);
    this.gamma = Maf.randomInRange(.1, 1);
    this.x = Maf.randomInRange(-1, 1);
    this.y = Maf.randomInRange(-1, 1);
    this.z = Maf.randomInRange(-1, 1);
  }
}

export { RabinovichFabrikantAttractor }