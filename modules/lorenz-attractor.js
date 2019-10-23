import Maf from './maf.js';

function LorenzAttractor() {
  this.id = 'lorenz';
  this.a = 10;
  this.b = 28;
  this.c = 8 / 3;
  this.x = 0;
  this.y = 10;
  this.z = 10;
  this.h = .004;
}

LorenzAttractor.prototype.generatePoint = function(x, y, z) {
  var nx = this.a * (y - x);
  var ny = (x * (this.b - z) - y);
  var nz = (x * y - this.c * z);
  x += this.h * nx;
  y += this.h * ny;
  z += this.h * nz;
  return { x: x, y: y, z: z }
}

LorenzAttractor.prototype.randomize = function() {
  this.a = Maf.randomInRange(5, 20);
  this.b = Maf.randomInRange(5, 50);
  this.c = Maf.randomInRange(.1, .5);
  this.x = Maf.randomInRange(-10, 10);
  this.y = Maf.randomInRange(-10, 10);
  this.z = Maf.randomInRange(-10, 10);
}

export { LorenzAttractor }