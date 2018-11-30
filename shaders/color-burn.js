const colorBurn = `
vec4 colorBurn(vec4 base, vec4 blend) {
  vec4 color = 1. - (1.-blend) / base;
  return color;
}`;

export default colorBurn;