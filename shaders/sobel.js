const sobel = `
vec3 sobel(sampler2D texture, vec2 uv, float thickness) {
  float x = thickness * 1.0 / resolution.x;
  float y = thickness * 1.0 / resolution.y;
  vec4 horizEdge = vec4( 0.0 );
  horizEdge -= texture2D( texture, vec2( uv.x - x, uv.y - y ) ) * 1.0;
  horizEdge -= texture2D( texture, vec2( uv.x - x, uv.y     ) ) * 2.0;
  horizEdge -= texture2D( texture, vec2( uv.x - x, uv.y + y ) ) * 1.0;
  horizEdge += texture2D( texture, vec2( uv.x + x, uv.y - y ) ) * 1.0;
  horizEdge += texture2D( texture, vec2( uv.x + x, uv.y     ) ) * 2.0;
  horizEdge += texture2D( texture, vec2( uv.x + x, uv.y + y ) ) * 1.0;
  vec4 vertEdge = vec4( 0.0 );
  vertEdge -= texture2D( texture, vec2( uv.x - x, uv.y - y ) ) * 1.0;
  vertEdge -= texture2D( texture, vec2( uv.x    , uv.y - y ) ) * 2.0;
  vertEdge -= texture2D( texture, vec2( uv.x + x, uv.y - y ) ) * 1.0;
  vertEdge += texture2D( texture, vec2( uv.x - x, uv.y + y ) ) * 1.0;
  vertEdge += texture2D( texture, vec2( uv.x    , uv.y + y ) ) * 2.0;
  vertEdge += texture2D( texture, vec2( uv.x + x, uv.y + y ) ) * 1.0;
  vec3 edge = 1. - (sqrt((horizEdge.rgb * horizEdge.rgb) + (vertEdge.rgb * vertEdge.rgb)));
  return edge;
}`;

export default sobel;