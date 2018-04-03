import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
import Maf from '../modules/maf.js';
import {palette2} from '../modules/floriandelooij.js';

const canvas = context.canvas;

const loopDuration = 2;

function draw(startTime) {
  context.fillStyle = '#2b2e2d';
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  const s = 80;
  const s2 = 8;
  const w = .5 * (canvas.width + 8*s);

  context.save();
  context.translate(w-4*s,w-4*s);
  context.rotate(-time*(Math.PI/2)/loopDuration);
  context.strokeStyle = '#fff';
  context.fillStyle = '#fff';

  for (let y=-w; y<w; y+=s) {
    for (let x=-w; x<w; x+=s) {
      const d = Math.sqrt(x*x+y*y);
      context.fillStyle = palette2.range[Math.round(.02*d)%palette2.range.length];
      context.save();
      context.translate(x,y);
      const t = Maf.mod((.0025*d-time),loopDuration)/loopDuration;
      const t1 = easings.InOutQuint(t);
      context.rotate(-t1*(Math.PI/2));
      context.beginPath();
      context.rect(-.5*s, -s2, s, 2*s2);
      context.rect(-s2,-.5*s, 2*s2, s);
      context.fill();
      context.restore();
      context.save();
      context.translate(x,y);
      context.globalAlpha = .5;
      const t2 = easings.InOutCubic(t);
      context.rotate(-t2*(Math.PI/2));
      context.beginPath();
      context.rect(-.5*s, -s2, s, 2*s2);
      context.rect(-s2,-.5*s, 2*s2, s);
      context.fill();
      context.restore();
    }
  }

  context.restore();

}

export { draw, loopDuration, canvas };
