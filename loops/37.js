import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
import Maf from '../modules/maf.js';
import {palette2} from '../modules/floriandelooij.js';

const canvas = context.canvas;

const loopDuration = 4;

function draw(startTime) {
  context.fillStyle = '#2b2e2d';
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  const s = 40;
  const s2 = 16;
  const w = .5 * (canvas.width + 8*s);

  context.save();
  context.translate(w-4*s,w-4*s);
  context.rotate(Maf.TAU*time/loopDuration);
  context.strokeStyle = '#fff';
  context.fillStyle = '#fff';

  for (let y=-w; y<w; y+=s) {
    for (let x=-w; x<w; x+=s) {
      const d = Math.sqrt(x*x+y*y);
      context.fillStyle = palette2.range[Math.round(.02*d)%palette2.range.length];
      context.save();
      context.translate(x,y);
      const t = Maf.mod((.005*1.5*d-time),loopDuration)/loopDuration;
      const t1 = easings.InOutQuint(t);
      context.rotate(-t1*(Maf.TAU));
      context.beginPath();
      context.moveTo(0,0);
      const a = .5*Math.PI*Maf.parabola(easings.InOutQuad(t),4);
      context.arc(0,0,.5*s,0,-a, true);
      context.closePath();
      context.fill();
      context.restore();
    }
  }

  context.restore();

}

export { draw, loopDuration, canvas };
