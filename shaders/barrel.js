const barrel = `

vec2 computeUV(vec2 uv, float k, float kcube) {

  vec2 t = uv - .5;
  float r2 = t.x * t.x + t.y * t.y;
  float f = 0.;

  if (kcube == 0.0) {
    f = 1. + r2 * k;
  } else {
    f = 1. + r2 * (k + kcube * sqrt(r2));
  }

  vec2 nUv = f * t + .5;
  nUv.y = nUv.y;

  return nUv;

}

vec4 barrel(sampler2D inputTexture, vec2 iuv, float k, float kCube, vec2 resolution, vec4 fill) {
  vec2 uv = computeUV(iuv, k, kCube);
  if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) {
    return fill;
  } else {
    vec4 c = texture2D(inputTexture, uv);
    //c.rgb *= .75 + .25 * sin( 1.5 * resolution.y * uv.y );
    return c;
  }
}`;

export { barrel }