import context from '../modules/context2d.js';
const canvas = context.canvas;

const loopDuration = 1;
const LINES = 50;

function draw() {
  context.fillStyle = '#fff';
  context.lineWidth = 1;
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * performance.now() ) % loopDuration;
  for (let j = 0; j < LINES; j++) {
    const y = j * canvas.height / LINES;
    context.beginPath();
    context.moveTo(-10,y);
    for(let x=-10; x<canvas.width+20;x++) {
      const dx = .5 * canvas.width - x;
      const dy = .5 * canvas.height - y;
      const d = Math.sqrt(dx*dx+dy*dy);
      let offset = 50. * Math.sin( .00005 * d * d - time * 2 * Math.PI / loopDuration ) * Math.exp( - .00001 * d * d );
      context.lineTo(x,y+offset);
    }
    context.lineTo(canvas.width+20,y+2*canvas.height);
    context.lineTo(-10,y+2*canvas.height);
    context.closePath();
    context.fill();
    context.stroke();
  }
}

export { draw, loopDuration, canvas };
