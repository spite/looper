import context from '../modules/context2d.js';
import perlin from '../third_party/perlin.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';

const canvas = context.canvas;

function sample(x,y,z) {
  return perlin.perlin3(x,y,z);
}

function getCoord(radius,a,level,time,effect) {
  const px = .005 * radius * Math.cos(a-.005*level+time);
  const py = .005 * radius * Math.sin(a-.005*level+time);
  const r = radius + effect * radius * sample(px,py,time);
  const x = r * Math.cos(a);
  const y = level + .5 * r * Math.sin(a);
  return {x,y};
}

function drawCircle(radius,level,time,effect) {
  const step = 2 * Math.PI / 200;
  const start = getCoord(radius,0,level,time,effect);
  context.beginPath();
  context.moveTo(start.x,start.y)
  for(let a=0; a<2*Math.PI; a+=step) {
    const point = getCoord(radius,a,level,time,effect);
    context.lineTo(point.x,point.y);
  }
  context.lineTo(start.x,start.y);
  context.lineWidth = 2;
  context.fillStyle = '#fff';
  context.globalAlpha = .5;
  context.fill();
  context.globalAlpha = .25;
  context.strokeStyle = '#000';
  context.stroke();
}

function generateBubbles(num,speedMin,speedMax) {
  const bubbles = [];
  for (let j=0; j<num; j++) {
    bubbles.push({
      x: Maf.randomInRange(-1,1),
      y: Maf.randomInRange(-1,1),
      size: Maf.randomInRange(0,1),
      speed: Maf.randomInRange(.5,1.5)
    })
  }
  return bubbles;
}

const backgroundBubbles = generateBubbles(30);
const foregroundBubbles = generateBubbles(20);

function drawBubble(x,y,size) {
  context.beginPath();
  context.arc(x,y,size,0,2*Math.PI);
  context.fillStyle = '#fff';
  context.globalAlpha = .75;
  context.fill();
  context.strokeStyle = '#000';
  context.globalAlpha = .25;
  context.stroke();
}

function drawBubbles(bubbles, size, time) {
  bubbles.forEach( b => {
    const x = b.x * .5*canvas.width;
    const y = b.y * .5*canvas.height;
    drawBubble(x,y+b.speed*time*canvas.height,1+size*b.size);
    drawBubble(x,y-b.speed*canvas.height+b.speed*time*canvas.height,1+size*b.size);
    drawBubble(x,y-2*b.speed*canvas.height+b.speed*time*canvas.height,1+size*b.size);
    drawBubble(x,y-3*b.speed*canvas.height+b.speed*time*canvas.height,1+size*b.size);
  })
}

const loopDuration = 3;

function draw(startTime) {
  context.save();
  context.fillStyle = '#fff';
  context.lineWidth = 1;
  context.fillRect(0,0,canvas.width, canvas.height);
  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  context.translate(.5*canvas.width,.5*canvas.height);
  context.rotate(-Math.PI/4);
  drawBubbles(backgroundBubbles,5,time/loopDuration);
  const subT = ((3*time)%loopDuration)/loopDuration;
  const effect = Maf.parabola(subT,3);
  const multiplier = Math.floor(subT);
  for (let y=.5*canvas.height; y>-.5*canvas.height; y-=10) {
    const r = Maf.parabola((y+.5*canvas.height)/canvas.height,.5);
    context.save();
    context.translate(0,r*100*Math.sin(subT*2*Math.PI));
    drawCircle(r*.25*canvas.width,.5*y,.001*y+time,effect);
    context.restore();
  }
  drawBubbles(foregroundBubbles,10,time/loopDuration);
  context.restore();
}

export { draw, loopDuration, canvas };
