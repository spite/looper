import context from '../modules/context2d.js';
const canvas = context.canvas;

const loopDuration = 1;

function drawCircle(ctx, x, y, fx, fy) {
  ctx.beginPath();
  ctx.ellipse(x,y, 50*fx, 50*fy, 0, 0, 2 * Math.PI);
  ctx.lineWidth = 15;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#000';
  ctx.stroke();
}

const CIRCLES = 5;

function draw() {
  context.fillStyle = '#fff';
  context.fillRect(0,0,canvas.width, canvas.height);
  for (let j=0; j<CIRCLES; j++) {
    const t = (.001*performance.now() % loopDuration);
    const t2 = t * 2 * Math.PI / loopDuration + 2 * Math.PI * j / CIRCLES;
    const x = .35 * canvas.width * Math.cos(t2);
    const y = 0;
    const f = Math.abs(Math.sin(t2));
    const fx = 1 + .5 * f;
    const fy = 1 - .5 * f;
    context.save();
    context.translate(.5*canvas.width, .5*canvas.height);
    context.rotate(j * 2 * Math.PI / CIRCLES );
    drawCircle(context,x,y,fx, fy);
    context.restore();
  }
}

export { draw, loopDuration, canvas };
