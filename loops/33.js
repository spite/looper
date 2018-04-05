import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
import Maf from '../modules/maf.js';
import {palette2} from '../modules/floriandelooij.js';
import pointsOnSphere from '../modules/points-sphere.js';
import THREE from '../third_party/three.js';

const canvas = context.canvas;

const loopDuration = 4;

const points = pointsOnSphere(100);

const camera = new THREE.Vector3(0,0,200);

function draw(startTime) {
  context.fillStyle = '#2b2e2d';
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  const s = 80;
  const s2 = 16;
  const w = .5 * (canvas.width + 8*s);

  context.save();
  context.translate(w-4*s,w-4*s);
  context.strokeStyle = '#fff';
  context.fillStyle = '#fff';

  const projectedPoints = points.map( p => {
    const t = p.clone();
    const r = Math.sqrt(p.x*p.x+p.y*p.y+p.z*p.z);
    const a = 2 * Math.PI * easings.InOutQuad(time/ loopDuration);
    const theta = Math.atan2(p.y,p.x)+a;
    const phi = Math.acos(p.z/r)+a;
    t.x = r * Math.cos(theta) * Math.sin(phi);
    t.y = r * Math.sin(theta) * Math.sin(phi);
    t.z = r * Math.cos(phi);
    const s = .45 * canvas.width;
    const x = s * t.x;
    const y = s * t.y;
    const z = p.z;
    return {x,y,z};
  });

  projectedPoints.forEach( p => {
    const d = .01*Math.abs(p.x);
    context.globalCompositeOperation = 'lighter'
    context.globalAlpha = p.z;
    context.fillStyle = '#ff0000';
    context.beginPath();
    context.arc(p.x-d,p.y,10+2*p.z,0,2*Math.PI);
    context.fill();
    context.fillStyle = '#00ff00';
    context.beginPath();
    context.arc(p.x,p.y,10+2*p.z,0,2*Math.PI);
    context.fill();
    context.fillStyle = '#0000ff';
    context.beginPath();
    context.arc(p.x+d,p.y,10+2*p.z,0,2*Math.PI);
    context.fill();
  });

  context.restore();

}

export { draw, loopDuration, canvas };
