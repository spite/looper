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
  InQuart: function (t) { return t * t * t * t; },
  OutQuart: function (t) { return 1 - (--t * t * t * t); },
  InOutQuart: function (t) {
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
  InSine: function (t) { return 1 - Math.cos(t * Math.PI / 2); },
  OutSine: function (t) { return Math.sin(t * Math.PI / 2); },
  InOutSine: function (t) { return 0.5 * (1 - Math.cos(Math.PI * t)); },
  InBounce: function(t) { return 1 - outBounce(1 - t); },
  OutBounce : function (t){
    if (t < 0.36363636363636365) {
      return 7.5625 * t * t;
    } else if (t < 0.7272727272727273) {
      t = t - 0.5454545454545454;
      return 7.5625 * t * t + 0.75;
    } else if (t < 0.9090909090909091) {
      t = t - 0.8181818181818182;
      return 7.5625 * t * t + 0.9375;
    } else {
      t = t - 0.9545454545454546;
      return 7.5625 * t * t + 0.984375;
    }
  },
  InOutBounce : function (t){
    if (t < 0.5){
      return inBounce (t*2) * 0.5;
    }
    return outBounce ( t*2-1 ) * 0.5 + 1 * 0.5;
  },
  InElastic : function (t, amplitude, period){
    if (typeof period == 'undefined') {
      period = 0;
    }
    if (typeof amplitude == 'undefined'){
      amplitude = 1;
    }
    var offset = 1.70158;

    if (t == 0) return 0;
    if (t == 1) return 1;

    if (!period){
      period = .3;
    }

    if (amplitude < 1){
      amplitude = 1;
      offset = period / 4;
    } else {
      offset = period / (2*Math.PI) * Math.asin(1 / amplitude);
    }

    return -(amplitude*Math.pow(2,10*(t-=1)) * Math.sin( (t - offset) * (Math.PI * 2) / period));
  },
  OutElastic : function (t, amplitude, period){
    if (typeof period == 'undefined') {
      period = 0;
    }
    if (typeof amplitude == 'undefined'){
      amplitude = 1;
    }
    var offset = 1.70158;

    if (t == 0) return 0;
    if (t == 1) return 1;

    if (!period){
      period = .3;
    }

    if (amplitude < 1){
      amplitude = 1;
      offset = period / 4;
    } else {
      offset = period / (2*Math.PI) * Math.asin(1 / amplitude);
    }

    return amplitude * Math.pow(2, -10 * t) * Math.sin( (t - offset) * (Math.PI * 2) / period ) + 1;
  },
  InOutElastic : function (t, amplitude, period){
    var offset;
    t = (t / 2) - 1;
    // escape early for 0 and 1
    if (t === 0 || t === 1) {
      return t;
    }
    if (!period){
      period = 0.44999999999999996;
    }
    if (!amplitude){
      amplitude = 1;
      offset = period / 4;
    } else {
      offset = period / (Math.PI * 2.0) * Math.asin(1 / amplitude);
    }
    return (amplitude * Math.pow(2, 10 * t) * Math.sin((t - offset) * (Math.PI * 2) / period )) / -2;
  },
  InExpo : function (t){
    return Math.pow(2, 10 * (t - 1));
  },
  OutExpo : function (t){
    return -Math.pow(2, -10 * t) + 1;
  },
  InOutExpo : function (t){
    if (t==0) return 0;
    if (t==1) return 1;
    if ((t/=.5) < 1) return .5 * Math.pow(2, 10 * (t - 1));
    return .5 * (-Math.pow(2, -10 * --t) + 2);
  },
  InCirc : function (t){
    return -1 * (Math.sqrt(1 - t * t) - 1);
  },
  OutCirc : function (t){
    t = t - 1;
    return Math.sqrt(1 - t * t);
  },
  InOutCirc : function (t){
    var c = 1;
    if ((t/=.5) < 1) return -.5 * (Math.sqrt(1 - t*t) - 1);
      return .5 * (Math.sqrt(1 - (t-=2)*t) + 1);
  },
  InBack : function (t, overshoot){
    if (!overshoot && overshoot !== 0){
      overshoot = 1.70158;
    }
    return 1 * t * t * ( (overshoot + 1) * t - overshoot );
  },
  OutBack : function (t, overshoot){
    if(!overshoot && overshoot !== 0){
      overshoot = 1.70158;
    }
    t = t - 1;
    return t * t * ((overshoot + 1) * t + overshoot) + 1;
  },
  InOutBack : function (t, overshoot){
    if (overshoot == undefined) overshoot = 1.70158;
    if ((t/=.5) < 1) return .5*(t*t*(((overshoot*=(1.525))+1)*t - overshoot));
    return .5*((t-=2)*t*(((overshoot*=(1.525))+1)*t + overshoot) + 2);
  }

};

const outBounce = Easings.OutBounce;

export default Easings;
