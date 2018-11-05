const gammaCorrect = `
vec3 gammaCorrect(vec3 color, vec3 gamma){
    return pow(color, 1.0/gamma);
}`;

const levelRange = `
vec3 levelRange(vec3 color, vec3 minInput, vec3 maxInput){
    return min(max(color - minInput, vec3(0.0)) / (maxInput - minInput), vec3(1.0));
}`;

const finalLevels = `
vec3 finalLevels(vec3 color, vec3 minInput, vec3 gamma, vec3 maxInput){
    return gammaCorrect(levelRange(color, minInput, maxInput), gamma);
}`;

export { gammaCorrect, levelRange, finalLevels };