const softLight = `
float applySoftLightToChannel( float base, float blend ) {
  return ((blend < 0.5) ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend)) : (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend)));
}

vec4 softLight(vec4 base, vec4 blend) {
  vec4 color = vec4(
    applySoftLightToChannel( base.r, blend.r ),
    applySoftLightToChannel( base.g, blend.g ),
    applySoftLightToChannel( base.b, blend.b ),
    applySoftLightToChannel( base.a, blend.a )
  );
  return color;
}`;

export default softLight;
