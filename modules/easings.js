const Easings = {
  Linear: function (t) { return t; },
  InQuad: function (t) { return t * t; },
  OutQuad: function (t) { return t * (2 - t); },
  InOutQuad: function (t) {
    if ((t *= 2) < 1) {
      return 0.5 * t * t;
    }
    return -0.5 * (--t * (t - 2) - 1);
  },
  InCubic: function (t) { return t * t * t; },
  OutCubic: function (t) { return --t * t * t + 1; },
  InOutCubic: function (t) {
    if ((t *= 2) < 1) {
      return .5 * t * t * t;
    }
    return .5 * ((t -= 2) * t * t + 2);
  },
  InQuartic: function (t) { return t * t * t * t; },
  OutQuartic: function (t) { return 1 - (--t * t * t * t); },
  InOutQuartic: function (t) {
    if ((t *= 2) < 1) {
      return .5 * t * t * t * t;
    }
    return .5 * ((t -= 2) * t * t * t - 2);
  },
  InQuint: function (t) { return t * t * t * t * t; },
  OutQuint: function (t) { return --t * t * t * t * t + 1; },
  InOutQuint: function (t) {
    if ((t *= 2) < 1)
      return 0.5 * t * t * t * t * t;
    return 0.5 * ((t -= 2) * t * t * t * t + 2);
  },
  InSinusoidal: function (t) { return 1 - Math.cos(t * Math.PI / 2); },
  OutSinusoidal: function (t) { return Math.sin(t * Math.PI / 2); },
  InOutSinusoidal: function (t) { return 0.5 * (1 - Math.cos(Math.PI * t)); }
};

export default Easings;
