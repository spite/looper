import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
import Maf from '../modules/maf.js';

const canvas = context.canvas;

const loopDuration = 2;
const RADIUS = .45*canvas.width;

const circles = [];
for (let j=0; j<10; j++) {
  const a = Maf.randomInRange(.1, .9);
  const b = Maf.randomInRange(.1, .9);
  const theta = Maf.randomInRange(0, Maf.TAU);
  const offset = Maf.randomInRange(0,1);
  const radiusScale = Maf.randomInRange(.8,1);
  const thickness = Maf.randomInRange(1,4);
  circles.push({a,b,theta,offset,radiusScale,thickness});
}

function drawCircle(x,y,radius) {
  const ax = 4;
  context.save();
  context.translate(-x,-y);
  context.strokeStyle = '#ff0000';
  context.beginPath();
  context.arc(-ax,0,radius,0,Maf.TAU);
  context.stroke();
  context.strokeStyle = '#00ff00';
  context.beginPath();
  context.arc(0,0,radius,0,Maf.TAU);
  context.stroke();
  context.strokeStyle = '#0000ff';
  context.beginPath();
  context.arc(ax,0,radius,0,Maf.TAU);
  context.stroke();
  context.restore();
}

function calcCircleRadius(x,y,r) {
    var d = Math.sqrt(x*x+y*y);
    return r - d;
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

  context.lineWidth = 10;
  drawCircle(0,0,RADIUS);
  circles.forEach( c => {
    const tt = (t + c.offset)%1;
    const {x,y} = pointInEllipse(c.a*RADIUS,c.b*RADIUS,c.theta,tt);
    context.lineWidth = c.thickness;
    const r = calcCircleRadius(x,y,RADIUS)-c.thickness;
    context.globalAlpha = .3;
    drawCircle(x,y,r);
    drawCircle(x,y,r*.5);
    drawCircle(x,y,r*.25);
  });

  context.restore();

}

export { draw, loopDuration, canvas };
