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

function drawVerticalLine(x,t) {
  const ax = 4;
  context.save();

  const path = new Path2D();
  path.moveTo(x,0);
  const step = 100;
  for (let y=-step; y<=canvas.height+step; y+= step) {
    path.quadraticCurveTo(x+Math.cos(t*Maf.TAU+x+y*.5*Maf.PI/2)*.5*step,y-.5*step,x,y);
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

function draw(startTime) {
  context.fillStyle = '#000';
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time/loopDuration;

  context.save();
  context.translate(.5*canvas.width,.5*canvas.height);
  context.rotate(Maf.PI/2);
  context.translate(-.5*canvas.width,-.5*canvas.height);

  const a = t*Maf.PI/2;
  context.strokeStyle = '#ffffff';
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'lighten';

  context.lineWidth = 10;
  const step = 50;
  for (let x=-.5*step; x<=canvas.width+.5*step; x+= step) {
    drawVerticalLine(x,t);
  }

  context.restore();

}

export { draw, loopDuration, canvas };
