const fs = `
precision highp float;

uniform sampler2D inputTexture;
uniform sampler2D depthTexture;

uniform vec2 resolution;
uniform float time;

varying vec2 vUv;

float nrand( vec2 n ) {
  return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);
}

vec2 rot2d( vec2 p, float a ) {
  vec2 sc = vec2(sin(a),cos(a));
  return vec2( dot( p, vec2(sc.y, -sc.x) ), dot( p, sc.xy ) );
}

const int NUM_TAPS = 27;
const float rcp_maxdist = 1.0 / 4.22244;

vec4 poissonSample( sampler2D map, vec2 uv, float radius ) {
  float max_siz = radius;
  vec2 fTaps_Poisson[NUM_TAPS];
  fTaps_Poisson[0]  = rcp_maxdist * vec2(  -0.8835609, 2.523391 );
  fTaps_Poisson[1]  = rcp_maxdist * vec2(  -1.387375, 1.056318 );
  fTaps_Poisson[2]  = rcp_maxdist * vec2(  -2.854452, 1.313645 );
  fTaps_Poisson[3]  = rcp_maxdist * vec2(  0.6326182, 1.14569 );
  fTaps_Poisson[4]  = rcp_maxdist * vec2(  1.331515, 3.637297 );
  fTaps_Poisson[5]  = rcp_maxdist * vec2(  -2.175307, 3.885795 );
  fTaps_Poisson[6]  = rcp_maxdist * vec2(  -0.5396664, 4.1938 );
  fTaps_Poisson[7]  = rcp_maxdist * vec2(  -0.6708734, -0.36875 );
  fTaps_Poisson[8]  = rcp_maxdist * vec2(  -2.083908, -0.6921188 );
  fTaps_Poisson[9]  = rcp_maxdist * vec2(  -3.219028, 2.85465 );
  fTaps_Poisson[10] = rcp_maxdist * vec2(  -1.863933, -2.742254 );
  fTaps_Poisson[11] = rcp_maxdist * vec2(  -4.125739, -1.283028 );
  fTaps_Poisson[12] = rcp_maxdist * vec2(  -3.376766, -2.81844 );
  fTaps_Poisson[13] = rcp_maxdist * vec2(  -3.974553, 0.5459405 );
  fTaps_Poisson[14] = rcp_maxdist * vec2(  3.102514, 1.717692 );
  fTaps_Poisson[15] = rcp_maxdist * vec2(  2.951887, 3.186624 );
  fTaps_Poisson[16] = rcp_maxdist * vec2(  1.33941, -0.166395 );
  fTaps_Poisson[17] = rcp_maxdist * vec2(  2.814727, -0.3216669 );
  fTaps_Poisson[18] = rcp_maxdist * vec2(  0.7786853, -2.235639 );
  fTaps_Poisson[19] = rcp_maxdist * vec2(  -0.7396695, -1.702466 );
  fTaps_Poisson[20] = rcp_maxdist * vec2(  0.4621856, -3.62525 );
  fTaps_Poisson[21] = rcp_maxdist * vec2(  4.181541, 0.5883132 );
  fTaps_Poisson[22] = rcp_maxdist * vec2(  4.22244, -1.11029 );
  fTaps_Poisson[23] = rcp_maxdist * vec2(  2.116917, -1.789436 );
  fTaps_Poisson[24] = rcp_maxdist * vec2(  1.915774, -3.425885 );
  fTaps_Poisson[25] = rcp_maxdist * vec2(  3.142686, -2.656329 );
  fTaps_Poisson[26] = rcp_maxdist * vec2(  -1.108632, -4.023479 );
  vec4 sum = vec4(0);
  vec2 seed = uv + fract( time );
  float rnd = 6.28 * nrand( seed );
  vec4 basis = vec4( rot2d(vec2(1,0),rnd), rot2d(vec2(0,1),rnd) );
  for (int i=0; i < NUM_TAPS; i += 1)
  {
    vec2 ofs = fTaps_Poisson[i]; ofs = vec2(dot(ofs,basis.xz),dot(ofs,basis.yw) );
        //vec2 ofs = rot2d( fTaps_Poisson[i], rnd );
    vec2 texcoord = uv + max_siz * ofs / resolution.xy;
    sum += texture2D(map, texcoord, -16.0);
  }
  return sum / vec4(NUM_TAPS);
}
#define USE_MIPMAP
// The Golden Angle is (3.-sqrt(5.0))*PI radians, which doesn't precompiled for some reason.
// The compiler is a dunce I tells-ya!!
#define GOLDEN_ANGLE 2.39996323
#define ITERATIONS 140
mat2 rot = mat2(cos(GOLDEN_ANGLE), sin(GOLDEN_ANGLE), -sin(GOLDEN_ANGLE), cos(GOLDEN_ANGLE));
//-------------------------------------------------------------------------------------------
vec3 Bokeh(sampler2D tex, vec2 uv, float radius, float amount)
{
  vec3 acc = vec3(0.0);
  vec3 div = vec3(0.0);
  vec2 pixel = 1.0 / resolution.xy;
  float r = 1.0;
    vec2 vangle = vec2(0.0,radius); // Start angle
    amount += radius*500.0;
  for (int j = 0; j < ITERATIONS; j += 2 )
  {
    r += 1. / r;
    vangle = rot * vangle;
    // (r-1.0) here is the equivalent to sqrt(0, 1, 2, 3...)
    #ifdef USE_MIPMAP
    vec3 col = texture2D(tex, uv + pixel * (r-1.) * vangle, radius).xyz;
    #else
    vec3 col = texture2D(tex, uv + pixel * (r-1.) * vangle).xyz;
    #endif
    col = col * col * 1.5; // ...contrast it for better highlights - leave this out elsewhere.
    vec3 bokeh = pow(col, vec3(9.0)) * amount+.4;
    acc += col * bokeh;
    div += bokeh;
  }
  return acc / div;
}
vec4 tex( sampler2D map, vec2 uv){
  return pow(texture2D(map, uv), vec4(2.2));
}
vec4 accumCol;
vec4 accumW;
const float mas = 0.0;
void add( sampler2D map, vec2 uv, float i, float j, float radius ){
  vec2 pixel = 1.0/resolution.xy;
  float factor = 1./resolution.y * 64.0;
  vec2 offset = pixel * vec2(i, j);
  vec4 col = tex( map, uv + offset * radius);
  vec4 bokeh = vec4(1.0) + pow(col, vec4(4.0)) * vec4(factor);
  accumCol += col * bokeh;
  accumW += bokeh;
}

void main() {
  vec2 uv = vUv;
  accumCol = vec4(0.0);
  accumW = vec4(0.0);
  float d = 1.-texture2D( depthTexture, vUv ).r;
  float depth = smoothstep( .3, .7, d - .35 );
  vec4 color = vec4( Bokeh( inputTexture, vUv, depth, 8. ), 1. );
  color.rgb = pow( color.rgb, 1. / vec3( 2.2 ) );
  gl_FragColor = color;
}`;

export { fs };