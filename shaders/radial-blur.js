import random from './random.js';

const radialBlur = `
${random}

vec4 radialBlur(sampler2D texture, vec2 center, float strength, vec2 resolution ,vec2 uv) {
    vec4 color=vec4(0.0);
    float total=0.0;
    vec2 toCenter=center-uv*resolution;
    float offset=random(vec3(12.9898,78.233,151.7182),0.0);
    for(float t=0.0;
        t<=40.0;
        t++){
        float percent=(t+offset)/40.0;
        float weight=4.0*(percent-percent*percent);
        vec4 sample=texture2D(texture,uv+toCenter*percent*strength/resolution);
        sample.rgb*=sample.a;
        color+=sample*weight;
        total+=weight;
    }
    color = color/total;
    color.rgb/=color.a+0.00001;
    return color;
}`;

export default radialBlur;