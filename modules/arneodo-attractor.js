import Maf from './maf.js';

class ArneodoAttractor {

  constructor() {
    this.alpha = -5.5;
    this.beta = 3.5;
    this.delta = -1;
    this.x = -1;
    this.y = 0;
    this.z = .5;
    this.h = .025;
  }

  generatePoint(x, y, z) {
    var nx = y;
    var ny = z;
    var nz = -this.alpha * x - this.beta * y - z + this.delta * x ** 3;
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

export { ArneodoAttractor }