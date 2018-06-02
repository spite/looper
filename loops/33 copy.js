import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
import Maf from '../modules/maf.js';
import {palette2} from '../modules/floriandelooij.js';
import pointsOnSphere from '../modules/points-sphere.js';
import THREE from '../third_party/three.js';

const canvas = context.canvas;

const loopDuration = 4;

const points = [
  new THREE.Vector3( 1, 1, 1),
  new THREE.Vector3(-1, 1, 1),
  new THREE.Vector3( 1,-1, 1),
  new THREE.Vector3(-1,-1, 1),

  new THREE.Vector3( 1, 1,-1),
  new THREE.Vector3(-1, 1,-1),
  new THREE.Vector3( 1,-1,-1),
  new THREE.Vector3(-1,-1,-1),
];//pointsOnSphere(1000);

const edges = [
  [0,1],
  [0,2],
  [1,3],
  [1,5],
  [3,7],
  [2,3],
  [4,5],
  [6,7],
  [6,4],
  [4]
];

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
    const a = time * 2 * Math.PI / loopDuration  + Math.atan2(p.x,p.z);
    t.x = 1 * Math.cos(a);
    t.y = t.y;
    t.z = 1 * Math.sin(a);
    const f = 200 / t.z;
    const x = 100 * t.x;
    const y = 100 * (t.y + t.z);
    return {x,y};
  });

  projectedPoints.forEach( p => {
    context.beginPath();
    context.arc(p.x,p.y,5,0,2*Math.PI);
    context.fill();
  });

  edges.forEach( e => {
    context.beginPath();
    const from = projectedPoints[e[0]];
    const to = projectedPoints[e[1]];
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  });

  context.restore();

}

export { draw, loopDuration, canvas };
