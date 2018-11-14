const fs = `
precision highp float;

uniform sampler2D colorTexture;
uniform sampler2D shadeTexture;

varying vec2 vUv;

void main() {
  vec4 c = texture2D(colorTexture, vUv);
  vec4 s = texture2D(shadeTexture, vUv);
  vec3 darkColor = vec3(13.,10.,8.)/255.;
  vec3 lightColor = vec3(170.,116.,70.)/255.;
  vec3 color = mix(darkColor,lightColor,c.r*c.b+smoothstep(.25,.75,c.b));
  vec3 backgroundColor = vec3(47.,49.,50.)/255.;
  gl_FragColor.rgb = vec3(color*s.r)+ vec3(.5*(1.-.99*c.g)*c.a);
  gl_FragColor.rgb = mix(backgroundColor ,gl_FragColor.rgb, smoothstep(.2,.8,c.a));
  gl_FragColor.a = 1.;
}`;

export { fs };