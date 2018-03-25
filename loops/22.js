import context from '../modules/context2d.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';

const canvas = context.canvas;

const loopDuration = 2.5;

function draw(startTime) {
  context.save();
  context.fillStyle = '#000';
  context.lineWidth = 1;
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  const f = 3;
  const n = 30 + 90 * easings.InOutQuad(.5 + .5 * Math.cos(time*2*Math.PI/loopDuration));

  context.save();
  context.translate(.5*canvas.width-20, .5*canvas.height-5);
  context.fillStyle = '#000';
  for (let a=0; a<2*Math.PI; a+=2*Math.PI/n) {
    context.save();
    context.rotate(a);
    const offset1 = 50 + 50 * Math.cos(time*2*Math.PI/loopDuration);
    const offset2 = 50 + 50 * Math.sin(f*a+time*2*Math.PI/loopDuration);
    for (let y=0; y<.25*canvas.width; y+=20) {
      const r = 10 + 10 * Math.cos(y*2*Math.PI/500+a+Math.PI+time*4*Math.PI/loopDuration);
      const radius = r;
      context.globalAlpha = 1;
      context.fillStyle = `hsl(${180+a*180/Math.PI},50%,80%)`;
      //context.fillRect(r-.5*radius,offset1+offset2+r+y-.5*radius,radius,radius);
      context.beginPath();
      context.arc(r,offset1+offset2+r+y+.5*radius,.25*radius,0,2*Math.PI);
      context.fill();
    }
    context.restore();
  }
  for (let a=0; a<2*Math.PI; a+=2*Math.PI/n) {
    context.save();
    context.rotate(a);
    const offset1 = 50 + 50 * Math.cos(time*2*Math.PI/loopDuration);
    const offset2 = 50 + 50 * Math.sin(f*a+time*2*Math.PI/loopDuration);
    context.globalAlpha = 1;
    for (let y=0; y<.25*canvas.width; y+=20) {
      const r = 10 + 10 * Math.cos(y*2*Math.PI/500+a+time*4*Math.PI/loopDuration);
      const radius = r;
      context.fillStyle = `hsl(${a*180/Math.PI},100%,60%)`;
      context.beginPath();
      context.arc(r,offset1+offset2+r+y,.25*radius,0,2*Math.PI);
      context.fill();
    }
    context.restore();
  }
  context.restore();

  context.restore();
}

export { draw, loopDuration, canvas };
