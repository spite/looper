import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
import Maf from '../modules/maf.js';

const canvas = context.canvas;

const loopDuration = 2;
const RADIUS = .45*canvas.width;

const circles = [];
for (let j=0; j<20; j++) {
  const a = Maf.randomInRange(.1, .9);
  const b = Maf.randomInRange(.1, .9);
  const theta = Maf.randomInRange(0, Maf.TAU);
  const offset = Maf.randomInRange(0,1);
  const thickness = Maf.randomInRange(2,6);
  circles.push({a,b,theta,offset,thickness});
}

function drawEllipse(x,y,a,b,theta,s,e) {
  const ax = 4;
  context.save();
  context.translate(-x,-y);

  const path = new Path2D();
  const p0 = pointInEllipse(a,b,theta,s);
  path.moveTo(p0.x,p0.y);
  for (let tt=s; tt<s+e; tt+=.01) {
    const p = pointInEllipse(a,b,theta,tt);
    path.lineTo(p.x,p.y);
  }

  context.translate(-ax,0);
  context.strokeStyle = '#ff0000';
  context.stroke(path);
  context.translate(ax,0);
  context.strokeStyle = '#00ff00';
  context.stroke(path);
  context.translate(ax,0);
  context.strokeStyle = '#0000ff';
  context.stroke(path);

  context.restore();
}

function pointInEllipse(a,b,theta,t) {
  const x = a * Math.cos(t*Maf.TAU) * Math.cos(theta) - b * Math.sin(t*Maf.TAU) * Math.sin(theta);
  const y = a * Math.cos(t*Maf.TAU) * Math.sin(theta) + b * Math.sin(t*Maf.TAU) * Math.cos(theta);
  return {x,y}
}

function draw(startTime) {
  context.fillStyle = '#000';
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time/loopDuration;

  context.save();
  context.translate(.5*canvas.width, .5*canvas.height);
  context.strokeStyle = '#ffffff';
  context.globalAlpha = .5;
  context.globalCompositeOperation = 'lighten';

  context.setLineDash([8,4]);
  context.lineDashOffset = 4;

  context.lineWidth = 10;
  circles.forEach( c => {
    const tt = (t + c.offset)%1;
    context.lineWidth = c.thickness*(1+Maf.parabola(tt,4));
    drawEllipse(0,0,c.a*RADIUS,c.a*RADIUS,c.theta-tt*Maf.TAU,0,.5+.5*Math.sin(tt*Maf.TAU));
  });

  context.restore();

}

export { draw, loopDuration, canvas };
