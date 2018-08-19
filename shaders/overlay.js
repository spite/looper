const overlay = `
float applyOverlayToChannel( float base, float blend ) {
  return (base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)));
}

vec4 overlay(vec4 base, vec4 blend, float opacity) {
  vec4 color = vec4(
    applyOverlayToChannel( base.r, blend.r ),
    applyOverlayToChannel( base.g, blend.g ),
    applyOverlayToChannel( base.b, blend.b ),
    applyOverlayToChannel( base.a, blend.a )
  );
  return color * opacity + base * ( 1. - opacity );
}

`;

export default overlay;
