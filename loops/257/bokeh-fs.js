const fs = `
precision highp float;

uniform sampler2D inputTexture;
uniform sampler2D depthTexture;

uniform vec2 resolution;
uniform float time;

varying vec2 vUv;

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