import Maf from './maf.js';

class ChenCelikovskyAttractor {

  constructor() {
    this.alpha = 36;
    this.beta = 3;
    this.delta = 20;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.h = .004;
  }

  generatePoint(x, y, z) {
    var nx = this.alpha * (y - x);
    var ny = -x * z + this.delta * y;
    var nz = x * y - this.beta * z;
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

export { ChenCelikovskyAttractor }