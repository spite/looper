import * as emptyModule from '../loops/empty.js';

async function loadModule() {
  const num = window.location.hash.substr(1) || 1;
  const module = await
  import (`../loops/${num}.js`);
  document.body.appendChild(module.canvas);
  return module;
}

async function init() {
  let module = await loadModule();

  async function reload() {
    if (module && module.canvas) {
      try {
        document.body.removeChild(module.canvas);
      } catch (e) {

      }
    }
    try {
      module = await loadModule();
    } catch (e) {
      module = emptyModule;
      console.log(e);
    }
  }

  const capturer = new CCapture({
    verbose: false,
    display: true,
    framerate: 60,
    motionBlurFrames: 0 * (960 / 60),
    quality: 99,
    format: 'gif',
    timeLimit: module.loopDuration,
    frameLimit: 0,
    autoSaveTime: 0,
    workersPath: 'js/'
  });

  let startTime = 0;

  function capture() {
    capturer.start();
    startTime = performance.now();
  }

  document.getElementById('start').addEventListener('click', e => {
    capture();
    e.preventDefault();
  });

  function update() {
    requestAnimationFrame(update);
    if (!skip) module.draw(startTime);
    capturer.capture(module.canvas);
  }

  update();

  window.addEventListener('hashchange', async e => {
    reload();
  })
}

window.skip = false;

window.addEventListener('load', init);