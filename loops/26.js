import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
import Maf from '../modules/maf.js';

const canvas = context.canvas;

const loopDuration = 4;

function drawSquare(size, range) {

  let sign = 1;
  if (range>1) {
    range = 1 - (range-1);
    sign = -1;
  }

  context.beginPath();
  const r = .7*size;
  for (let a=0; a<=(range)*2*Math.PI; a+=2*Math.PI/180) {
    const x = Maf.clamp( r * Math.cos(sign*(a+(range)*2*Math.PI)),-.5*size, .5*size);
    const y = Maf.clamp( r * Math.sin(sign*(a+(range)*2*Math.PI)),-.5*size, .5*size);
    if (a===0) context.moveTo(x,y);
    else context.lineTo(x,y);
  }
 // context.globalAlpha = .2 + range;
  context.stroke();
}

function draw(startTime) {
  context.fillStyle = '#fff';
  context.lineWidth = 1;
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  context.save();
  context.translate(.5*canvas.width, .5*canvas.height);
  context.strokeStyle = '#000';
  context.fillStyle = '#fff';

  const SIDE = .75 * canvas.width;
  const STEP = 80;
  for (let y=-SIDE; y<SIDE; y+=STEP) {
    for (let x=-SIDE; x<SIDE; x+=STEP) {
      context.save();
      const tx = x+Maf.clamp(easings.InOutQuint(2*time/loopDuration),0,1)*STEP;
      const ty = y+Maf.clamp(easings.InOutQuint(2*time/loopDuration-1),0,1)*STEP;
      context.translate(tx,ty);
      context.rotate(.25*Math.PI);
      const d = Math.sqrt(tx*tx+ty*ty);
      const f = 1;
      context.lineWidth = 200/(.5+d);
      context.strokeStyle = '#000';
      drawSquare(f*STEP,(2*time/loopDuration+.001*d)%2);
      context.restore();
    }
  }
  context.restore();

}

export { draw, loopDuration, canvas };
