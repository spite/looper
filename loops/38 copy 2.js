import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
import Maf from '../modules/maf.js';
import {palette2} from '../modules/floriandelooij.js';
import doChromaticAberration from '../modules/canvas-chromatic-aberration.js';

const canvas = context.canvas;

const loopDuration = 2;

function draw(startTime) {
  context.fillStyle = '#2b2e2d';
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  const s = 80;
  const s2 = 10;
  const w = .5 * (canvas.width + 8*s);

  context.save();
  context.translate(w-4*s,w-4*s);
  context.rotate((Math.PI/2)*easings.Linear(time/loopDuration));
  context.strokeStyle = '#fff';
  context.fillStyle = '#fff';
  context.globalCompositeOperation = 'lighten';

  for (let y=-w; y<w; y+=s) {
    for (let x=-w; x<w; x+=s) {
      const d = Math.sqrt(x*x+y*y);
      context.fillStyle = palette2.range[Math.round(.02*d)%palette2.range.length];
      const t = Maf.mod((.0025*d-time),loopDuration)/loopDuration;
      const t1 = easings.InOutCubic(t);
      const f = .5 +Maf.parabola(t,8);
      context.save();
      context.translate(x,y);
      context.rotate(-t1*(Math.PI/2));

      context.beginPath();
      context.moveTo(-s,-s);
      context.arc(-s,-s,s2*f,0,2*Math.PI);
      context.fill();

      context.beginPath();
      context.moveTo(s,-s);
      context.arc(s,-s,s2*f,0,2*Math.PI);
      context.fill();

      context.beginPath();
      context.moveTo(s,s);
      context.arc(s,s,s2*f,0,2*Math.PI);
      context.fill();

      context.beginPath();
      context.moveTo(-s,s);
      context.arc(-s,s,s2*f,0,2*Math.PI);
      context.fill();

      context.restore();
    }
  }

  context.restore();

  doChromaticAberration(canvas,1.01);
}

export { draw, loopDuration, canvas };
