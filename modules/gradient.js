import THREE from '../third_party/three.js';
import Maf from '../modules/maf.js';

class gradientLinear {
  constructor(colors) {
    this.colors = colors.map((c) => new THREE.Color(c));
  }
  getAt(t) {
    t = Maf.clamp(t, 0, 1);
    const from = Math.floor(t * this.colors.length * .9999);
    const to = Maf.clamp(from + 1, 0, this.colors.length - 1);
    const fc = this.colors[from];
    const ft = this.colors[to];
    const p = (t - from / this.colors.length) / (1 / this.colors.length);
    const res = new THREE.Color();
    res.r = Maf.mix(fc.r, ft.r, p);
    res.g = Maf.mix(fc.g, ft.g, p);
    res.b = Maf.mix(fc.b, ft.b, p);
    return res;
  }
}

export { gradientLinear };