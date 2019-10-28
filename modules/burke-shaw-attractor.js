import Maf from './maf.js';

class BurkeShawAttractor {

  constructor() {
    this.sigma = .95;
    this.upsilon = .7;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.h = .04;
  }

  generatePoint(x, y, z) {
    var nx = -this.sigma * (x + y);
    var ny = -y - this.upsilon * x * z;
    var nz = this.sigma * x * y + this.upsilon;
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

export { BurkeShawAttractor }