import THREE from '../third_party/three.js';
import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
import Maf from '../modules/maf.js';

const canvas = context.canvas;

const loopDuration = 2;
const RADIUS = 100;

const circles = [];
for (let y=0; y<3; y++) {
  for (let x=0; x<3; x++) {
    circles.push({x,y});
  }
}

function drawLine(path,x1,y1,x2,y2,curvature) {
  const cx = x1 + ( x2 - x1 ) / 2;
  const cy = y1 + ( y2 - y1 ) / 2;
  const n = new THREE.Vector2(cx,cy).normalize().multiplyScalar(curvature);
  path.quadraticCurveTo(cx+n.x,cy+n.y,x2,y2);
}

function drawCircle(x,y,r,f) {
  const ax = 4;
  context.save();
  context.translate(-x,-y);

  const path = new Path2D();
  path.moveTo(r,0);
  const sides = 6;
  for (let j=0; j<sides; j++) {
    const a = j * Maf.TAU / sides;
    const a2 = (j+1) * Maf.TAU / sides;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    const x2 = r * Math.cos(a2);
    const y2 = r * Math.sin(a2);
    drawLine(path,x,y,x2,y2,f);
  }
  path.closePath();

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
  circles.forEach( (c,i) => {
    const tt = (t + i / circles.length ) % 1;
    drawCircle(2*c.x*RADIUS-2*RADIUS,.85*(2*c.y*RADIUS-2*RADIUS),RADIUS,.25*RADIUS*Maf.parabola(tt,4));
  });

  context.restore();

}

export { draw, loopDuration, canvas };
