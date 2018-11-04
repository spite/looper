import smootherstep from './smootherstep.js';

const rgbShift = `
${smootherstep}

vec4 rgbShift(sampler2D inputTexture, vec2 uv, vec2 delta){

  vec2 dir = uv - vec2( .5 );
  float d = .7 * length( dir );
  normalize( dir );
  vec2 value = d * dir * delta;

  vec4 c1 = texture2D( inputTexture, uv - value / resolution.x );
  vec4 c2 = texture2D( inputTexture, uv );
  vec4 c3 = texture2D( inputTexture, uv + value / resolution.y );

  return vec4( c1.r, c2.g, c3.b, c1.a + c2.a + c3.b );

}
`;

export default rgbShift;