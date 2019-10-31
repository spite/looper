import Maf from './maf.js';

class HadleyAttractor {

  constructor() {
    this.alpha = .2;
    this.beta = 4;
    this.sigma = 8;
    this.delta = 1;
    this.x = -1;
    this.y = 0;
    this.z = .5;
    this.h = .02;
  }

  generatePoint(x, y, z) {
    var nx = -y * y - z * z - this.alpha * x + this.alpha * this.sigma;
    var ny = x * y - this.beta * x * z - y + this.delta;
    var nz = this.beta * x * y + x * z - z;
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

export { HadleyAttractor }