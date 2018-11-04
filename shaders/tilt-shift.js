import smootherstep from './smootherstep.js';

const tiltShift = `
${smootherstep}

vec4 tiltShift(sampler2D inputTexture, vec2 uv){

  vec4 sum = vec4( 0. );
  vec2 inc = vec2( 0., .005 * smootherstep( 0., .5, abs( .5 - uv.y ) ) );

  sum += texture2D( inputTexture, ( uv - inc * 4. ) ) * 0.051;
  sum += texture2D( inputTexture, ( uv - inc * 3. ) ) * 0.0918;
  sum += texture2D( inputTexture, ( uv - inc * 2. ) ) * 0.12245;
  sum += texture2D( inputTexture, ( uv - inc * 1. ) ) * 0.1531;
  sum += texture2D( inputTexture, ( uv + inc * 0. ) ) * 0.1633;
  sum += texture2D( inputTexture, ( uv + inc * 1. ) ) * 0.1531;
  sum += texture2D( inputTexture, ( uv + inc * 2. ) ) * 0.12245;
  sum += texture2D( inputTexture, ( uv + inc * 3. ) ) * 0.0918;
  sum += texture2D( inputTexture, ( uv + inc * 4. ) ) * 0.051;

  return sum;

}
`;

export default tiltShift;