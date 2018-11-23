const random = `
float random(vec3 scale,float seed){
    return fract(sin(dot(gl_FragCoord.xyz+seed,scale))*43758.5453+seed);
}
`;

export default random;