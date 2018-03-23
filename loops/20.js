import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
const canvas = context.canvas;

const loopDuration = 1.5;

function getPosition(radius, angle, time) {
  const amplitude = 20;
  const factor = Math.cos(.02 * radius + time * 2 * Math.PI / loopDuration);
  const offsetx = amplitude * factor;
  const factor2 = Math.sin(.02 * radius + time * 4 * Math.PI / loopDuration);
  const offsety = amplitude * factor2;
  const scale = .2 + .8 * (.5 + .5 * factor);
  const x = radius * Math.cos(angle+radius) + offsetx;
  const y = radius *  Math.sin(angle+radius) + offsety;
  return {x,y}
}

function draw(startTime) {
  context.fillStyle = '#fff';
  context.lineWidth = 1;
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  const separation = 8;

  context.save(),
  context.translate(.5*canvas.width, .5*canvas.height);
  context.fillStyle = '#000';
  for (let radius=0; radius<.75*canvas.width; radius+=separation ) {
    const p = 2 * Math.PI * radius;
    const step = 2 * Math.PI / Math.round( p / separation);
    context.beginPath();
    const factor = radius / (.75*canvas.width);
    context.strokeStyle = `hsl(0,0%,${factor*100}%)`;
    context.lineWidth = (1-factor)*10;
    const aOffset = time * 2 * Math.PI / loopDuration;
    const {x0,y0} = getPosition(radius, aOffset, time);
    context.moveTo(x0,y0);
    for (let angle=0; angle<2*Math.PI; angle+=step) {
      const {x,y} = getPosition(radius, angle + aOffset, time);
      context.lineTo(x,y);
    }
    context.closePath();
    context.stroke();
  }
  context.restore();

}

export { draw, loopDuration, canvas };
