import Maf from './maf.js';

class AizawaAttractor {

  constructor() {
    this.alpha = .95;
    this.beta = .7;
    this.gamma = .6;
    this.delta = 3.5;
    this.epsilon = .25;
    this.sigma = .1;
    this.x = -1;
    this.y = 0;
    this.z = .5;
    this.h = .008;
  }

  generatePoint(x, y, z) {
    var nx = (z - this.beta) * x - this.delta * y;
    var ny = this.delta * x + (z - this.beta) * y;
    var nz = this.gamma + (this.alpha * z) - (z ** 3 / 3) - (x ** 2 + y ** 2) * (1 + this.epsilon * z) + this.sigma *
      z * x ** 3;
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

export { AizawaAttractor }