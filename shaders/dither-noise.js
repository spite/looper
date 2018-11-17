const ditherNoise = `
float ditherNoise(vec2 n, float offset ){
  //return fract(sin(dot(gl_FragCoord.xyz+seed,scale))*43758.5453);
  return .5 - fract(sin(dot(n.xy + vec2( offset, 0. ), vec2(12.9898, 78.233)))* 43758.5453);
}`;

export default ditherNoise;