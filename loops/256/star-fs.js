const fs = `
precision highp float;

uniform float time;
uniform float time2;

varying vec2 vUv;
varying vec3 vWorldPos;
varying float vDisplacement;
varying float vDepth;

float snoise(vec3 uv, float res)
{
  const vec3 s = vec3(1e0, 1e2, 1e3);

  uv *= res;

  vec3 uv0 = floor(mod(uv, res))*s;
  vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;

  vec3 f = fract(uv); f = f*f*(3.0-2.0*f);

  vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
              uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);

  vec4 r = fract(sin(v*1e-1)*1e3);
  float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

  r = fract(sin((v + uv1.z - uv0.z)*1e-1)*1e3);
  float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

  return mix(r0, r1, f.z)*2.-1.;
}

#define PI 3.1415926535897932384626433832795

float level(vec2 uv, float scale, float t) {
  vec2 p = -.5 + uv;
  p *= scale;

  float color = 1.0 - (1.*length(2.*p));

  vec3 coord = vec3(atan(p.x,p.y)/6.2832+.5, length(p)*.4, .5);

  for(int i = 1; i <= 6; i++)
  {
    float power = pow(2.0, float(i));
    color += (2. / power) * snoise(coord + vec3(0.,-t*.05, t*.01), (power*16.));
  }
  return color;
}

float parabola ( float x, float k ) {
  return pow( 4. * x * ( 1. - x ), k );
}

float levels(vec2 uv, float time, float flare, float gradient) {
  float color = 10.*flare + gradient * level(vUv,1.,time) * (1.-level(vUv,2.,2.*time)) * (1.-level(vUv,3.,time));
  color += .5*level(vUv,.5,2.*time);
  return color;
}

void main() {

  float gradient = 1.0 - (1.*length(-.5+vUv));
  float flare = pow(gradient,40.);
  float color1 = levels(vUv, time, flare, gradient);
  float color2 = levels(vUv + vec2(23.,34.), time2, flare, gradient);
  float f = parabola(time,2.);
  float color = mix(color2, color1, f);
  color *= (1.-length(-.5+vUv))/2.;
  color /=1. + length(-.5+vUv);
  gl_FragColor = vec4( color, pow(max(color,0.),2.)*0.4, pow(max(color,0.),3.)*0.15 , 1.0);

}`;

export { fs };