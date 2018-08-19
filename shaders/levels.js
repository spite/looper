const gammaCorrect = `
vec3 gammaCorrect(vec3 color, float gamma){
    return pow(color, vec3(1.0/gamma));
}`;

const levelRange = `
vec3 levelRange(vec3 color, float minInput, float maxInput){
    return min(max(color - vec3(minInput), vec3(0.0)) / (vec3(maxInput) - vec3(minInput)), vec3(1.0));
}`;

const finalLevels = `
vec3 finalLevels(vec3 color, float minInput, float gamma, float maxInput){
    return gammaCorrect(levelRange(color, minInput, maxInput), gamma);
}`;

export {gammaCorrect, levelRange, finalLevels};
