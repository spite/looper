import THREE from '../third_party/three.js';
import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
import Maf from '../modules/maf.js';

const canvas = context.canvas;

const loopDuration = 2;

function drawLine(path,x1,y1,x2,y2,curvature) {
  const cx = x1 + ( x2 - x1 ) / 2;
  const cy = y1 + ( y2 - y1 ) / 2;
  const n = new THREE.Vector2(cx,cy).normalize().multiplyScalar(curvature);
  path.quadraticCurveTo(cx+n.x,cy+n.y,x2,y2);
}

function drawPolygon(sides,x,y,r,angle,f) {
  const ax = 4;
  context.save();
  context.translate(-x,-y);

  const path = new Path2D();
  const x0 = r * Math.cos(angle);
  const y0 = r * Math.sin(angle);
  path.moveTo(x0,y0);
  for (let j=0; j<sides; j++) {
    const a = j * Maf.TAU / sides + angle;
    const a2 = (j+1) * Maf.TAU / sides + angle;
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

  const SIDES = 6;
  context.save();
  context.translate(.5*canvas.width, .5*canvas.height);
  const a = t*Maf.TAU/SIDES;
  context.strokeStyle = '#ffffff';
  context.globalCompositeOperation = 'lighten';

  context.lineWidth = 10;
  for (let i=0; i<20; i++) {
    const tt = (t + i / 20 ) % 1;
    const r = i * 40;
    context.globalAlpha = .4 + Maf.parabola(tt,1)*.4;
    //context.rotate(.005*i*Math.sin(t*Maf.TAU));
    drawPolygon(SIDES,0,0,r,a,15*i*Math.sin(tt*Maf.TAU));
  }

  context.restore();

}

export { draw, loopDuration, canvas };
