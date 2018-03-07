import context from '../modules/context2d.js';
const canvas = context.canvas;

const loopDuration = 1;

function draw() {
  context.fillStyle = '#fff';
  context.lineWidth = 1;
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * performance.now() ) % loopDuration;

  const d = 32;
  const w = canvas.width;
  const h = canvas.height;

  context.fillStyle = '#000000';
  for( var y = -.5*h; y < 2*h; y+=d ){
    for( var x = -.5*w; x < 2*w; x+=d ){
      context.beginPath();
      const r = .5 * d;
      const a = time * 2 * Math.PI / loopDuration + .01 * (x + y);
      const px = x + r * Math.cos(a);
      const py = y + r * Math.sin(a);
      const ar = 10 + 5 * Math.sin(a);
      context.arc(px,py,ar,0,2*Math.PI);
      context.fill();
    }
  }
}

export { draw, loopDuration, canvas };
