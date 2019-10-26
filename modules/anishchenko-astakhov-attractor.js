import Maf from './maf.js';

class AnishchenkoAstakhov {

  constructor() {
    this.mu = 1.2;
    this.eta = .5;
    this.x = -1;
    this.y = 0;
    this.z = .5;
    this.h = .05;
  }

  generatePoint(x, y, z) {

    function I(x) {
      if (x > 0) return 1;
      if (x <= 0) return 0;
    }

    var nx = this.mu * x + y - x * z;
    var ny = -x;
    var nz = -this.eta * z + this.eta * I(x) * x ** 2;
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

export { AnishchenkoAstakhov }