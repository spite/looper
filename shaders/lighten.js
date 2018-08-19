const lighten = `

vec4 lighten(vec4 base, vec4 blend) {
  return max(base, blend);
}

`;

export default lighten;
