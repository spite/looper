// r: radius
// theta: 0-Pi
// phi: 0-Tau

function sphericalToCartesian(r, theta, phi) {
  const x = r * Math.sin(theta) * Math.cos(phi);
  const y = r * Math.sin(theta) * Math.sin(phi);
  const z = r * Math.cos(theta);
  return { x, y, z };
}

function cartesianToSpherical(x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z);
  const theta = Math.acos(z / r);
  const phi = Math.atan2(y, x);
  return { r, theta, phi };
}

export { sphericalToCartesian, cartesianToSpherical }