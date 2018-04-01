import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
import Maf from '../modules/maf.js';

const canvas = context.canvas;

const loopDuration = 4;

function draw(startTime) {
  context.fillStyle = '#fff';
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  context.save();
  context.translate(.5*canvas.width, .5*canvas.height);
  context.strokeStyle = '#000';
  context.fillStyle = '#fff';

  const baseCircleRadius = 30;
  const offset = time/loopDuration;

  for(let r=0; r<20; r++) {
    const circleRadius = baseCircleRadius - .5 *r;
    const radius = r*2.5*circleRadius;
    const f = Math.floor(Maf.TAU*radius/(3*circleRadius));
    const diff = Maf.TAU - (Math.floor(Maf.TAU/f) * f);
    const aOffset = offset * 5 * Maf.TAU/f;
    const l = 50 + 50 * Math.cos((.1*r+time)*2*Maf.TAU/loopDuration);
    for(let a=0; a<Maf.TAU; a+=Maf.TAU/f) {
      context.beginPath();
      const x = radius * Math.cos(a+diff+aOffset);
      const y = radius * Math.sin(a+diff+aOffset);
      context.arc(x,y,circleRadius,0,Maf.TAU);
      context.fillStyle = `hsl(0,0%,${l}%)`;
      context.fill();
    }
  }
  context.restore();

}

export { draw, loopDuration, canvas };
