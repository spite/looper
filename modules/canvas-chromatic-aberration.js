function doChromaticAberration(canvas) {
  const context = canvas.getContext('2d');
  const imageData = context.getImageData(0,0,canvas.width,canvas.height);
  const targetImageData = context.createImageData(canvas.width,canvas.height);
  let ptr = 0;
  const offset = 2;
  for (let y=0; y<canvas.height; y++) {
    for (let x=0; x<canvas.width; x++) {
      const dx = .5*canvas.width-x;
      const dy = .5*canvas.height-y;
      const d = Math.sqrt(dx*dx+dy*dy);
      const tx1 = x + (1+offset)*dx/d;
      const ty1 = y + (1+offset)*dy/d;
      const tPtr1 = (Math.round(ty1)*canvas.width + Math.round(tx1))*4;
      const tx2 = x + (1-offset)*dx/d;
      const ty2 = y + (1-offset)*dy/d;
      const tPtr2 = (Math.round(ty2)*canvas.width + Math.round(tx2))*4;
      targetImageData.data[ptr] = imageData.data[tPtr1];
      targetImageData.data[ptr+1] = imageData.data[ptr+1];
      targetImageData.data[ptr+2] = imageData.data[tPtr2+2];
      targetImageData.data[ptr+3] = imageData.data[ptr+3];
      ptr+=4;
    }
  }
  context.putImageData(targetImageData,0,0);
}

export default doChromaticAberration;
