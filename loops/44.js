import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
import Maf from '../modules/maf.js';

const canvas = context.canvas;

const loopDuration = 2;

function drawCircle(radius, sign) {
  const steps = 20;
  const step = Maf.TAU/steps;
  for (let a=0; a<Maf.TAU; a+=step){
    context.beginPath();
    const x = (radius + sign * 10) * Math.cos(a-.1*step);
    const y = (radius + sign * 10) * Math.sin(a-.1*step);
    context.moveTo(x,y);
    const x2 = radius * Math.cos(a);
    const y2 = radius * Math.sin(a);
    context.lineTo(x2,y2);
    context.arc(0,0,radius,a,a+.75*step);
    const x3 = (radius - sign * 10) * Math.cos(a+.75*step+.1*step);
    const y3 = (radius - sign * 10) * Math.sin(a+.75*step+.1*step);
    context.lineTo(x3,y3);
    context.stroke();
  }
}
function draw(startTime) {
  context.fillStyle = '#ffffff';
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time/loopDuration;

  context.save();
  context.translate(.5*canvas.width, .5*canvas.height);
  context.lineWidth = 4;
  context.strokeStyle = '#000';
  context.beginPath();
  context.moveTo(0,-20);
  context.lineTo(0,20);
  context.stroke();
  context.beginPath();
  context.moveTo(-20,0);
  context.lineTo(20,0);
  context.stroke();

  const tt = easings.OutQuad(t);
  drawCircle((.3+.05*Math.cos(tt*Maf.TAU))* canvas.width, -1);
  drawCircle((.375+.05*Math.cos(tt*Maf.TAU))* canvas.width, 1);

  context.restore();
}

export { draw, loopDuration, canvas };
