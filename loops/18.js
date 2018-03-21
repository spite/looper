import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
const canvas = context.canvas;

const loopDuration = 2;

function draw(startTime) {
  context.fillStyle = '#fff';
  context.lineWidth = 1;
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  const circleRadius = 3;
  const separation = 3;
  const amplitude = 20;

  context.save(),
  context.translate(.5*canvas.width, .5*canvas.height);
  context.fillStyle = '#000';
  for (let radius=0; radius<.75*canvas.width; radius+=circleRadius*separation ) {
    const p = 2 * Math.PI * radius;
    const step = 2 * Math.PI / Math.round( p / (circleRadius*separation));
    for (let angle=0; angle<2*Math.PI; angle+=step) {
      const factor = Math.cos(.02 * radius + time * 2 * Math.PI / loopDuration);
      const offsetx = amplitude * factor;
      //const offsety = amplitude * Math.sin(.02 * radius + time * 2 * Math.PI / loopDuration)
      const offsety = amplitude * factor;
      const scale = .2 + .8 * (.5 + .5 * factor);
      const x = radius * Math.cos(angle+radius) + offsetx;
      const y = radius *  Math.sin(angle+radius) + offsety;
      //context.fillStyle = `hsl(0,0%,${50+factor*25}%)`;
      context.beginPath();
      context.arc(x,y,circleRadius*scale,0,2*Math.PI);
      context.fill();
    }
  }
  context.restore();

}

export { draw, loopDuration, canvas };
