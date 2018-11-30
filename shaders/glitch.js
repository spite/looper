const glitch = `
//2D (returns 0 - 1)
float random2d(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float randomRange (in vec2 seed, in float min, in float max) {
    return min + random2d(seed) * (max - min);
}

// return 1 if v inside 1d range
float insideRange(float v, float bottom, float top) {
   return step(bottom, v) - step(top, v);
}

//inputs
float amount = 0.2; //0 - 1 glitch amount
//float speed = 0.6; //0 - 1 speed

vec4 glitch( sampler2D inputTexture, vec2 uv, float speed, float time ) {

  float t = floor(time * speed * 60.0);

  //copy orig
  vec3 outCol = texture2D(inputTexture, uv).rgb;

  //randomly offset slices horizontally
  float maxOffset = amount/2.0;
  for (float i = 0.0; i < 10.0 * .2; i += 1.0) {
    float sliceY = random2d(vec2(t , 2345.0 + float(i)));
    float sliceH = random2d(vec2(t , 9035.0 + float(i))) * 0.25;
    float hOffset = randomRange(vec2(t , 9625.0 + float(i)), -maxOffset, maxOffset);
    vec2 uvOff = uv;
    uvOff.x += hOffset;
    if (insideRange(uv.y, sliceY, fract(sliceY+sliceH)) == 1.0 ){
      outCol = texture2D(inputTexture, uvOff).rgb;
    }
  }

  //do slight offset on one entire channel
  float maxColOffset = amount/6.0;
  float rnd = random2d(vec2(t , 9545.0));
  vec2 colOffset = vec2(randomRange(vec2(t , 9545.0),-maxColOffset,maxColOffset),
                     randomRange(vec2(t , 7205.0),-maxColOffset,maxColOffset));
  if (rnd < 0.33){
      outCol.r = texture2D(inputTexture, uv + colOffset).r;

  }else if (rnd < 0.66){
      outCol.g = texture2D(inputTexture, uv + colOffset).g;

  } else{
      outCol.b = texture2D(inputTexture, uv + colOffset).b;
  }

  return vec4(outCol,1.0);
}`;

export { glitch }