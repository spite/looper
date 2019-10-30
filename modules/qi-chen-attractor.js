import Maf from './maf.js';

class QiChenAttractor {

  constructor() {
    this.alpha = 38;
    this.beta = 8 / 3;
    this.sigma = 80;
    this.x = .1;
    this.y = .1;
    this.z = .1;
    this.h = .001;
  }

  generatePoint(x, y, z) {
    var nx = this.alpha * (y - x) + y * z;
    var ny = this.sigma * x + y - x * z;
    var nz = x * y - this.beta * z;
    x += this.h * nx;
    y += this.h * ny;
    z += this.h * nz;
    return { x: x, y: y, z: z }
  }

  randomize() {
    this.alpha = Maf.randomInRange(.1, 1);
    this.beta = Maf.randomInRange(.1, 1);
    this.gamma = Maf.randomInRange(.1, 1);
    this.x = Maf.randomInRange(-1, 1);
    this.y = Maf.randomInRange(-1, 1);
    this.z = Maf.randomInRange(-1, 1);
  }
}

export { QiChenAttractor }