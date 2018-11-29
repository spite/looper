const grayscale = `
float grayscale(vec3 color) {
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}

float grayscale(vec4 color) {
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}`;

export default grayscale;