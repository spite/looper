import context from '../modules/context2d.js';
import easings from '../modules/easings.js';
const canvas = context.canvas;

const tileSize = 80;

function drawTile(x,y,angle) {
  context.save();
  context.translate(x+.5*tileSize,y+.5*tileSize);
  context.rotate(angle);

  context.fillStyle = '#fff';
  context.fillRect(-.5*tileSize,-.5*tileSize,tileSize,tileSize);

  context.lineWidth = .5;
  context.strokeStyle = '#888';
  context.beginPath();
  context.rect(-.5*tileSize,-.5*tileSize,tileSize,tileSize);
  //context.arc(0,0,.5*tileSize,0,2*Math.PI);
  context.stroke();

  context.lineWidth = 8;
  context.strokeStyle = '#222';
  context.beginPath();
  context.arc(-.5*tileSize,-.5*tileSize,.5*tileSize,0,Math.PI/2);
  context.stroke();

  context.beginPath();
  context.arc(.5*tileSize,.5*tileSize,.5*tileSize,-Math.PI,-Math.PI/2);
  context.stroke();

  context.restore();
}

const MAXROTS = 5;
const rot = [];

for (let y=0; y<canvas.height;y+=tileSize) {
  rot[y] = [];
  for (let x=0; x<canvas.width;x+=tileSize) {
    let angle = 0;
    if(x>=.5*canvas.width) angle = Math.PI/2;
    if(y>=.5*canvas.width) angle = Math.PI/2;
    if(x>=.5*canvas.width && y>=.5*canvas.width ) angle = 0;
    angle = Math.random() > .5 ? Math.PI/2 : 0;
    let rotations = [];
    let sum = 0;
    do {
      sum = 0;
      for (let i=0; i<MAXROTS; i++) {
        rotations[i] = Math.random() > .25 ? 1: 0;
        sum += rotations[i];
      }
    } while(sum%2!==0);

    rot[y][x] = {
      angle,
      rotations
    }
  }
}

const loopDuration = 5;

function draw(startTime) {
  context.fillStyle = '#fff';
  context.lineWidth = 1;
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  for (let y=0; y<canvas.height;y+=tileSize) {
    for (let x=0; x<canvas.width;x+=tileSize) {
      const tt = ((time - .0005*x -.0005*y + loopDuration) % loopDuration) / loopDuration;
      const t = easings.OutCubic(easings.OutCubic(tt % (1 /MAXROTS)*MAXROTS));
      const r = Math.floor(tt * MAXROTS);
      let ha = rot[y][x].angle;
      for (let i=0; i<r; i++) {
        ha += .5 * Math.PI * rot[y][x].rotations[i];
      }
      const a = ha + .5 * Math.PI * rot[y][x].rotations[r] * t;
      drawTile(x,y,a);
    }
  }

}

export { draw, loopDuration, canvas };
