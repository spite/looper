function get2DCanvasContext() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 800;
  canvas.style.width = '400px';
  canvas.style.height = '400px';
  return canvas.getContext('2d');
}

const context = get2DCanvasContext();

export default context;
